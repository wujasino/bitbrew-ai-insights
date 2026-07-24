"""One-off generator for the Presora icon set — composites the cream woven-P
mark onto the app's ink-navy tile background, matching Wordmark.tsx's design
(lavender/cream mark on a dark rounded tile), at every size the app needs."""
from PIL import Image

PUBLIC = "/home/user/presora/public"
INK = (15, 15, 35, 255)  # #0F0F23 — same ink used for the dark theme background / meta theme-color

mark = Image.open(f"{PUBLIC}/presora-mark-cream.png").convert("RGBA")


def composite(size: int) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), INK)
    # Mark fills ~66% of the tile height, centered, preserving its aspect ratio.
    target_h = round(size * 0.66)
    scale = target_h / mark.height
    target_w = round(mark.width * scale)
    resized = mark.resize((target_w, target_h), Image.LANCZOS)
    x = (size - target_w) // 2
    y = (size - target_h) // 2
    canvas.alpha_composite(resized, (x, y))
    return canvas


sizes = {
    "presora-icon-512.png": 512,
    "android-chrome-512.png": 512,
    "android-chrome-192.png": 192,
    "apple-touch-icon.png": 180,
    "favicon-64.png": 64,
    "favicon-32.png": 32,
    "favicon-16.png": 16,
}

images = {}
for name, size in sizes.items():
    img = composite(size)
    images[size] = img
    img.save(f"{PUBLIC}/{name}")
    print(f"wrote {name} ({size}x{size})")

# Multi-resolution favicon.ico from the 16/32/48 renders
ico_sizes = [16, 32, 48]
ico_base = composite(48)
images[16].save(
    f"{PUBLIC}/favicon.ico",
    sizes=[(s, s) for s in ico_sizes],
    append_images=[composite(s) for s in ico_sizes if s != 16],
)
print("wrote favicon.ico")

# Email header mark: just the transparent cream mark, no tile — retina (2x) source
# for a 64px display height, used bare (no background box) in email-templates/*.html
email_h = 128
email_scale = email_h / mark.height
email_w = round(mark.width * email_scale)
mark.resize((email_w, email_h), Image.LANCZOS).save(f"{PUBLIC}/presora-mark-email.png")
print(f"wrote presora-mark-email.png ({email_w}x{email_h})")
