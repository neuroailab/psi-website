#!/usr/bin/env python3
"""Reflow the existing recorded three-by-three grids into four-example grids.

This preserves every source video frame and its clock, including baked goals and
measured progress traces. No source carousel or existing capability-film asset is
modified. Progress originals are 2x supersampled; crop coordinates follow their
actual resolution. The output cells contain the complete source rectangle and
use one-pixel vertical padding rather than stretching its aspect ratio.

Usage: python rebuild-four-grid-assets.py --ffmpeg /path/to/ffmpeg
The JSON receipt on stdout includes source/output hashes and verified metadata.
"""

import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess


ASSETS = Path(__file__).resolve().parents[1] / "assets"
DESTINATION = ASSETS / "capability-film"
SELECTIONS = {
    "policy": {"source": "policy-grid", "tiles": [0, 1, 5, 4], "frames": 1991},
    "simulation": {
        "source": "simulation-trim8-grid", "tiles": [0, 1, 4, 5], "frames": 2716,
    },
    "progress": {"source": "progress-grid", "tiles": [2, 0, 4, 3], "frames": 1864},
}


def digest(path):
    return hashlib.file_digest(path.open("rb"), "sha256").hexdigest()


def probe(ffprobe, path):
    result = json.loads(subprocess.check_output([
        ffprobe, "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path),
    ]))
    video = next(s for s in result["streams"] if s["codec_type"] == "video")
    return {
        "width": video["width"], "height": video["height"],
        "fps": video["r_frame_rate"], "frames": video.get("nb_frames"),
        "duration": video.get("duration"), "bytes": int(result["format"]["size"]),
        "audio_streams": sum(s["codec_type"] == "audio" for s in result["streams"]),
    }


def filter_graph(tiles, width):
    if width not in (1248, 2496):
        raise ValueError(f"Unexpected source grid width: {width}")
    supersampling = width // 1248
    parts = ["[0:v]split=4" + "".join(f"[s{i}]" for i in range(4))]
    for slot, tile in enumerate(tiles):
        crop = [408, 230, tile % 3 * 420, tile // 3 * 242]
        crop = ":".join(str(v * supersampling) for v in crop)
        parts.append(
            f"[s{slot}]crop={crop},scale=618:348:flags=lanczos,setsar=1,"
            f"pad=630:364:0:1:color=0x0c1921[t{slot}]"
        )
    parts.append(
        "[t0][t1][t2][t3]xstack=inputs=4:layout=0_0|630_0|0_364|630_364,"
        "crop=1248:714:0:0[out]"
    )
    return ";".join(parts)


def reflow(ffmpeg, ffprobe, source, destination, tiles, frames=None):
    before = probe(ffprobe, source)
    command = [
        ffmpeg, "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
        "-threads", "1", "-filter_threads", "1", "-i", str(source),
        "-filter_complex_threads", "1",
        "-filter_complex", filter_graph(tiles, before["width"]), "-map", "[out]", "-an",
    ]
    if frames is not None:
        if int(before["frames"]) != frames or before["fps"] != "30/1":
            raise ValueError(f"Unexpected source clock: {source}: {before}")
        command += [
            "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-threads", "1",
            "-pix_fmt", "yuv420p", "-vsync", "0", "-movflags", "+faststart",
            "-progress", "pipe:2",
        ]
    else:
        command += ["-frames:v", "1", "-threads", "1"]
        if destination.suffix == ".jpg":
            command += ["-q:v", "2"]
    subprocess.run(command + [str(destination)], check=True)
    after = probe(ffprobe, destination)
    assert (after["width"], after["height"]) == (1248, 714), after
    assert after["audio_streams"] == 0, after
    if frames is not None:
        assert int(after["frames"]) == frames, after
        assert after["fps"] == before["fps"], after
        assert after["duration"] == before["duration"], (before, after)
    return {
        "source": source.name, "source_sha256": digest(source),
        "output": destination.name, "output_sha256": digest(destination),
        "tiles": tiles, "metadata": after,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffmpeg", default="ffmpeg")
    args = parser.parse_args()
    ffmpeg = shutil.which(args.ffmpeg)
    if not ffmpeg:
        raise SystemExit(f"FFmpeg not found: {args.ffmpeg}")
    ffprobe = str(Path(ffmpeg).with_name("ffprobe"))
    receipt = {"cell": [618, 350], "gap": [12, 14], "assets": []}
    for kind, config in SELECTIONS.items():
        for suffix in (".mp4", ".jpg"):
            receipt["assets"].append(reflow(
                ffmpeg, ffprobe, DESTINATION / (config["source"] + suffix),
                DESTINATION / (kind + "-grid-2x2" + suffix), config["tiles"],
                config["frames"] if suffix == ".mp4" else None,
            ))
        if kind in ("simulation", "progress"):
            receipt["assets"].append(reflow(
                ffmpeg, ffprobe, DESTINATION / (kind + "-grid-return.png"),
                DESTINATION / (kind + "-grid-return-2x2.png"), config["tiles"],
            ))
    for clip in ("simulation-2", "progress-4"):
        for suffix in (".mp4", ".jpg"):
            source = ASSETS / "carousel" / (clip + suffix)
            destination = DESTINATION / (clip + suffix)
            shutil.copy2(source, destination)
            assert digest(source) == digest(destination)
            receipt["assets"].append({
                "source": str(source.relative_to(ASSETS)), "output": destination.name,
                "source_sha256": digest(source), "output_sha256": digest(destination),
                "metadata": probe(ffprobe, destination),
            })
    print(json.dumps(receipt, indent=2))


if __name__ == "__main__":
    main()
