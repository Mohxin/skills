---
name: video-editing-cli
description: |
  Teach users how to perform video editing tasks using command-line tools (primarily FFmpeg). 
  Use this skill whenever the user asks about video editing via CLI, command-line video processing, 
  FFmpeg commands, video format conversion, trimming, merging, adding filters, extracting audio, 
  compressing videos, or any terminal-based video manipulation. Also use when users mention tools 
  like ffmpeg, ffprobe, mkvtoolnix, or ask how to edit videos without a GUI.
---

# Video Editing CLI

This skill provides comprehensive guidance for editing videos using command-line tools, with **FFmpeg** as the primary tool. FFmpeg is a free, open-source, cross-platform command-line framework for processing video, audio, and other multimedia files.

## Prerequisites

### Installing FFmpeg

Before using any commands, ensure FFmpeg is installed:

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install ffmpeg
```

**Windows (using Chocolatey):**
```bash
choco install ffmpeg
```

### Verify Installation
```bash
ffmpeg -version
ffprobe -version
```

## Core Concepts

### Understanding the FFmpeg Command Structure

Every FFmpeg command follows this basic pattern:
```bash
ffmpeg [input options] -i input_file [output options] output_file
```

- `-i` specifies the input file
- Options before `-i` affect how the input is read
- Options after `-i` affect how the output is created
- The output file extension determines the container format

### Common Flags Explained

| Flag | Description |
|------|-------------|
| `-i` | Input file |
| `-c` | Codec (e.g., `-c:v` for video, `-c:a` for audio) |
| `-b:v` | Video bitrate |
| `-b:a` | Audio bitrate |
| `-r` | Frame rate |
| `-s` | Resolution (e.g., `1920x1080`) |
| `-t` | Duration |
| `-ss` | Start time (seek) |
| `-to` | End time |
| `-vf` | Video filter graph |
| `-af` | Audio filter graph |
| `-y` | Overwrite output files without asking |
| `-n` | Never overwrite output files |
| `-hide_banner` | Hide FFmpeg banner for cleaner output |

## Common Video Editing Tasks

### 1. Format Conversion

**Convert video to MP4:**
```bash
ffmpeg -i input.avi -c:v libx264 -c:a aac output.mp4
```

**Convert to WebM:**
```bash
ffmpeg -i input.mp4 -c:v libvpx-vp9 -c:a libopus output.webm
```

**Convert audio only:**
```bash
ffmpeg -i input.mp4 -vn -c:a mp3 output.mp3
```

### 2. Trimming and Cutting

**Trim from 00:01:30 to 00:02:30:**
```bash
ffmpeg -i input.mp4 -ss 00:01:30 -to 00:02:30 -c copy output.mp4
```

**Trim first 10 seconds:**
```bash
ffmpeg -i input.mp4 -t 10 -c copy output.mp4
```

**Cut without re-encoding (fast, but may be imprecise):**
```bash
ffmpeg -ss 00:01:30 -i input.mp4 -t 60 -c copy output.mp4
```

### 3. Resizing and Scaling

**Scale to 1280x720:**
```bash
ffmpeg -i input.mp4 -vf "scale=1280:720" output.mp4
```

**Scale to half the original size:**
```bash
ffmpeg -i input.mp4 -vf "scale=iw/2:ih/2" output.mp4
```

**Scale while maintaining aspect ratio (width=640):**
```bash
ffmpeg -i input.mp4 -vf "scale=640:-1" output.mp4
```

### 4. Adding Watermarks and Overlays

**Add image watermark (top-left corner):**
```bash
ffmpeg -i input.mp4 -i watermark.png -filter_complex \
  "overlay=10:10" output.mp4
```

**Add watermark at bottom-right:**
```bash
ffmpeg -i input.mp4 -i watermark.png -filter_complex \
  "overlay=W-w-10:H-h-10" output.mp4
```

### 5. Video Filters

**Add fade in/out:**
```bash
ffmpeg -i input.mp4 -vf "fade=t=in:st=0:d=2,fade=t=out:st=8:d=2" output.mp4
```

**Adjust brightness and contrast:**
```bash
ffmpeg -i input.mp4 -vf "eq=brightness=0.06:contrast=1.2" output.mp4
```

**Add text overlay:**
```bash
ffmpeg -i input.mp4 -vf \
  "drawtext=text='My Video':fontsize=50:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" \
  output.mp4
```

### 6. Audio Operations

**Extract audio from video:**
```bash
ffmpeg -i input.mp4 -vn -c:a copy output.aac
```

**Replace audio in video:**
```bash
ffmpeg -i input_video.mp4 -i new_audio.mp3 -c:v copy -c:a aac output.mp4
```

**Adjust audio volume:**
```bash
ffmpeg -i input.mp4 -af "volume=1.5" output.mp4
```

**Mute video:**
```bash
ffmpeg -i input.mp4 -an output.mp4
```

### 7. Merging and Concatenation

**Merge multiple video files (same codec/format):**
Create a file `list.txt`:
```
file 'part1.mp4'
file 'part2.mp4'
file 'part3.mp4'
```

Then run:
```bash
ffmpeg -f concat -safe 0 -i list.txt -c copy output.mp4
```

### 8. Compression and Quality Control

**Compress with CRF (Constant Rate Factor, 0-51, lower=better, 23=default):**
```bash
ffmpeg -i input.mp4 -c:v libx264 -crf 28 output.mp4
```

**Limit file size (e.g., target 100MB for 60s video):**
```bash
# Target bitrate = (100MB * 8192) / 60s - audio_bitrate
ffmpeg -i input.mp4 -b:v 1300k -c:v libx264 -c:a aac -b:a 128k output.mp4
```

### 9. Extracting Frames and Creating GIFs

**Extract all frames as images:**
```bash
ffmpeg -i input.mp4 frames/frame_%04d.png
```

**Extract one frame at 5 seconds:**
```bash
ffmpeg -i input.mp4 -ss 00:00:05 -vframes 1 thumbnail.jpg
```

**Create GIF from video:**
```bash
ffmpeg -i input.mp4 -vf "fps=10,scale=320:-1:flags=lanczos" output.gif
```

### 10. Speed Control

**Double the speed (2x):**
```bash
ffmpeg -i input.mp4 -filter_complex "[0:v]setpts=0.5*PTS[v];[0:a]atempo=2.0[a]" \
  -map "[v]" -map "[a]" output.mp4
```

**Slow motion (0.5x):**
```bash
ffmpeg -i input.mp4 -filter_complex "[0:v]setpts=2*PTS[v];[0:a]atempo=0.5[a]" \
  -map "[v]" -map "[a]" output.mp4
```

### 11. Adding Subtitles

**Burn subtitles into video:**
```bash
ffmpeg -i input.mp4 -vf "subtitles=subs.srt" output.mp4
```

**Add subtitle track (not burned in):**
```bash
ffmpeg -i input.mp4 -i subs.srt -c copy -c:s mov_text output.mp4
```

### 12. Screen Recording

**Record screen (macOS):**
```bash
ffmpeg -f avfoundation -i "1:0" -r 30 output.mkv
```

**Record screen (Linux with x11grab):**
```bash
ffmpeg -f x11grab -s 1920x1080 -i :0.0 -r 30 output.mp4
```

## Useful CLI Utilities

### Get Video Information
```bash
ffprobe -v quiet -print_format json -show_format -show_streams input.mp4
```

### Get Video Duration
```bash
ffprobe -v quiet -show_entries format=duration -of csv=p=0 input.mp4
```

### Check if Video Has Audio
```bash
ffprobe -v quiet -show_entries stream=codec_type -of csv=p=0 input.mp4 | grep -q audio
```

## Pro Tips

1. **Always test with `-t 5`** to process only the first 5 seconds before running the full command
2. **Use `-c copy`** when you don't need to re-encode — it's much faster and preserves quality
3. **Use `-hide_banner`** to reduce console noise
4. **Use `-y`** to auto-overwrite in scripts, but be careful
5. **For batch processing**, combine with shell loops:
   ```bash
   for f in *.mp4; do ffmpeg -i "$f" -c:v libx265 "${f%.mp4}_hevc.mp4"; done
   ```
6. **Hardware acceleration** (if available):
   - NVIDIA: `-c:v h264_nvenc`
   - Apple Silicon: `-c:v h264_videotoolbox`
   - Intel QuickSync: `-c:v h264_qsv`

## Common Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Unrecognized option` | Typo or wrong flag | Check flag spelling and position |
| `Invalid data found when processing input` | Corrupt file or wrong format | Verify file integrity, try different input |
| `Stream mapping` issues | Incompatible codec | Use `-c:v libx264 -c:a aac` as safe defaults |
| `Permission denied` | Can't write to output path | Check file permissions, try different directory |

## When to Ask for Help

If you encounter:
- Complex filter graphs you don't understand
- Need to automate a repetitive task with a script
- Unusual codec or format requirements
- Need to batch process many files efficiently

Provide your current command, input file details, and desired output, and I'll help you craft the right solution.
