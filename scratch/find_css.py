import re

with open('src/index.css', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'gallery-video' in line or 'GalleryVideoPlayer' in line or 'gallery-modal-video' in line or 'video-modal-card' in line or 'happy-individual-glass-card' in line or 'sad-glass-photo' in line:
        print(f"{i+1}: {line.strip()}")
