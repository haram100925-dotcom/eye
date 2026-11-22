#!/usr/bin/env python3
"""
Generate high-resolution dark-mode Google Play Store screenshot assets in pure Python (no external dependencies).
Outputs to public/screenshots/
- phone_1_routine_dark.png (1080x1920)
- phone_2_gabor_dark.png (1080x1920)
- phone_3_vision_test_dark.png (1080x1920)
- phone_4_stats_dark.png (1080x1920)
- tablet_7inch_dark.png (1200x1920)
- desktop_16x9_dark.png (1920x1080)
- feature_graphic_1024x500_dark.png (1024x500)
"""

import os
import zlib
import struct
import math

def make_png(width, height, pixel_func):
    """
    pixel_func(x, y) -> (r, g, b)
    """
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0) # filter type 0 (None)
        for x in range(width):
            r, g, b = pixel_func(x, y)
            raw_data.append(r & 0xFF)
            raw_data.append(g & 0xFF)
            raw_data.append(b & 0xFF)
            
    compressed = zlib.compress(bytes(raw_data), level=6)
    
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
        
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', compressed) + chunk(b'IEND', b'')

def clamp(v, min_v=0, max_v=255):
    return max(min_v, min(max_v, int(v)))

def create_gradient_bg(width, height, top_color, bot_color, glow_center=None, glow_radius=300):
    t_r, t_g, t_b = top_color
    b_r, b_g, b_b = bot_color
    
    def get_pixel(x, y):
        ratio = y / height
        r = t_r + (b_r - t_r) * ratio
        g = t_g + (b_g - t_g) * ratio
        b = t_b + (b_b - t_b) * ratio
        
        if glow_center:
            gx, gy = glow_center
            dist = math.hypot(x - gx, y - gy)
            if dist < glow_radius:
                glow = (1.0 - dist / glow_radius) * 0.4
                r += 20 * glow
                g += 184 * glow
                b += 166 * glow
                
        return clamp(r), clamp(g), clamp(b)
        
    return get_pixel

def generate_all():
    out_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'screenshots')
    os.makedirs(out_dir, exist_ok=True)
    
    # 1. Feature Graphic (1024x500)
    print("Generating feature_graphic_1024x500_dark.png...")
    fg_func = create_gradient_bg(1024, 500, (11, 17, 32), (4, 47, 46), glow_center=(512, 250), glow_radius=400)
    with open(os.path.join(out_dir, 'feature_graphic_1024x500_dark.png'), 'wb') as f:
        f.write(make_png(1024, 500, fg_func))
        
    # 2. Phone 1 Routine (1080x1920)
    print("Generating phone_1_routine_dark.png...")
    p1_func = create_gradient_bg(1080, 1920, (10, 15, 29), (6, 78, 59), glow_center=(540, 800), glow_radius=600)
    with open(os.path.join(out_dir, 'phone_1_routine_dark.png'), 'wb') as f:
        f.write(make_png(1080, 1920, p1_func))
        
    # 3. Phone 2 Gabor Game (1080x1920)
    print("Generating phone_2_gabor_dark.png...")
    p2_func = create_gradient_bg(1080, 1920, (15, 23, 42), (13, 148, 136), glow_center=(540, 960), glow_radius=550)
    with open(os.path.join(out_dir, 'phone_2_gabor_dark.png'), 'wb') as f:
        f.write(make_png(1080, 1920, p2_func))
        
    # 4. Phone 3 Vision Test (1080x1920)
    print("Generating phone_3_vision_test_dark.png...")
    p3_func = create_gradient_bg(1080, 1920, (9, 14, 26), (15, 118, 110), glow_center=(540, 900), glow_radius=500)
    with open(os.path.join(out_dir, 'phone_3_vision_test_dark.png'), 'wb') as f:
        f.write(make_png(1080, 1920, p3_func))
        
    # 5. Phone 4 Stats (1080x1920)
    print("Generating phone_4_stats_dark.png...")
    p4_func = create_gradient_bg(1080, 1920, (11, 17, 32), (4, 47, 46), glow_center=(540, 1000), glow_radius=500)
    with open(os.path.join(out_dir, 'phone_4_stats_dark.png'), 'wb') as f:
        f.write(make_png(1080, 1920, p4_func))
        
    # 6. Tablet 7inch (1200x1920)
    print("Generating tablet_7inch_dark.png...")
    t_func = create_gradient_bg(1200, 1920, (10, 15, 29), (13, 148, 136), glow_center=(600, 960), glow_radius=600)
    with open(os.path.join(out_dir, 'tablet_7inch_dark.png'), 'wb') as f:
        f.write(make_png(1200, 1920, t_func))
        
    # 7. Desktop 16x9 (1920x1080)
    print("Generating desktop_16x9_dark.png...")
    d_func = create_gradient_bg(1920, 1080, (11, 17, 32), (6, 78, 59), glow_center=(960, 540), glow_radius=700)
    with open(os.path.join(out_dir, 'desktop_16x9_dark.png'), 'wb') as f:
        f.write(make_png(1920, 1080, d_func))
        
    print("All 7 assets generated successfully in public/screenshots/!")

if __name__ == '__main__':
    generate_all()
