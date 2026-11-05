"""Check trim boundaries, grid cadence, posters, and media metadata."""
from pathlib import Path
import hashlib
import json
import subprocess
from PIL import Image, ImageChops, ImageDraw, ImageStat

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'output'
CHECKS = OUT / 'validation-frames'
CHECKS.mkdir(exist_ok=True)
BIN = Path('/tmp/psiborg-story-runtime/bin')

def info(path):
    return json.loads(subprocess.check_output([str(BIN / 'ffprobe'), '-v', 'error', '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height,r_frame_rate,nb_frames,duration', '-of', 'json', str(path)]))['streams'][0]

def frame(path, index):
    dest = CHECKS / f'{path.stem}-{index:04d}.png'
    if not dest.exists():
        subprocess.run([str(BIN / 'ffmpeg'), '-nostdin', '-v', 'error', '-threads', '1', '-filter_threads', '1',
            '-ss', str(index / 30), '-i', str(path), '-frames:v', '1', '-threads', '1', '-y', str(dest)],
            check=True, timeout=30)
    return Image.open(dest).convert('RGB')

def metric(actual, expected, mask=None):
    stat = ImageStat.Stat(ImageChops.difference(actual, expected), mask)
    return {'mae': sum(stat.mean) / 3, 'rmse': (sum(v * v for v in stat.rms) / 3) ** .5,
            'max_abs': max(v[1] for v in stat.extrema)}

clip_src = ROOT / 'public/original-simulation-5.mp4'
grid_src = ROOT / 'public/original-simulation-grid.mp4'
clip = OUT / 'simulation-5.mp4'
grid = OUT / 'simulation-grid.mp4'
report = {'media': {}, 'clip_frames': [], 'grid_frames': [], 'posters': {}}
for path, count, width, height in [(clip, 516, 912, 512), (grid, 2716, 1248, 714)]:
    data = info(path)
    assert int(data['nb_frames']) == count and data['width'] == width and data['height'] == height, data
    assert data['r_frame_rate'] == '30/1', data
    assert abs(float(data['duration']) - count / 30) < .00001, data
    data['sha256'] = hashlib.sha256(path.read_bytes()).hexdigest()
    report['media'][path.name] = data

for index in [0, 1, 11, 12, 119, 120, 257, 503, 504, 515]:
    result = metric(frame(clip, index), frame(clip_src, index + 120))
    assert result['mae'] < 5, (index, result)
    report['clip_frames'].append({'frame': index, 'source_frame': index + 120, **result})

mask = Image.new('L', (1248, 714), 255)
ImageDraw.Draw(mask).rectangle((420, 242, 827, 471), fill=0)
for index in [0, 1, 11, 12, 119, 120, 515, 516, 517, 1031, 1032, 1548, 2064, 2580, 2715]:
    actual = frame(grid, index)
    original = frame(grid_src, index)
    sampled = index // 12 * 12
    rendered = Image.open(OUT / 'simulation-grid-frames' / f'element-{sampled:04d}.png').convert('RGB')
    unchanged = metric(actual, original, mask)
    unchanged_render = metric(rendered, original, mask)
    expected_cup = frame(clip_src, 120 + index % 516).resize((408, 230), Image.Resampling.BILINEAR)
    cup = metric(actual.crop((420, 242, 828, 472)), expected_cup)
    assert unchanged['mae'] < 5 and unchanged_render['mae'] < 2 and cup['mae'] < 8, (index, unchanged, unchanged_render, cup)
    report['grid_frames'].append({'frame': index, 'remotion_sample_frame': sampled, 'cup_source_frame': 120 + index % 516,
        'unchanged_cells': unchanged, 'unchanged_cells_lossless_render': unchanged_render, 'cup': cup})

for name in ['simulation-5', 'simulation-grid']:
    poster = Image.open(OUT / (name + '.jpg')).convert('RGB')
    result = metric(poster, frame(OUT / (name + '.mp4'), 0))
    assert result['mae'] < 5, (name, result)
    report['posters'][name] = result
report['status'] = 'passed'
(OUT / 'validation.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'status': report['status'], 'media': report['media'],
    'clip_frames_checked': len(report['clip_frames']), 'grid_frames_checked': len(report['grid_frames'])}, indent=2))
