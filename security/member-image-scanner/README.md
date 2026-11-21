# BetInsight member image scanner – isolated pilot
Not deployed, no production integration, no credentials. Does not affect KI-CONTROL.
Decodes actual JPEG/PNG/WebP pixels using Pillow, then streams the original bytes to a local clamd Unix socket. Approval only after exact clean response. SHA-256 binds the result to the inspected bytes. It does not remove metadata or rewrite original images.
Pilot input caps: 8,000,000 bytes, 24 million pixels, 12,000 per side, static images only. The 24 MP cap and APNG rejection are pilot choices, not new production restrictions.
Run tests with python -m unittest -v after installing requirements.txt. Tests generate real images and use a simulated clamd socket; actual malware detection and current signature verification still require a real ClamAV deployment. Use freshly updated signatures, bounded scanner time/memory, and an isolated non-root container. Do not expose clamd TCP.
Do not connect this pilot to the productive upload route until server capacity, real scanner performance and signature freshness, failure behavior, authenticated integration, and existing image compatibility have been validated.
