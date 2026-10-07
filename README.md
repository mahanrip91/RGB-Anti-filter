# RGB-Anti-filter v2

Minimal full-stack Cloudflare Worker prototype.

Flow: username + Cloudflare API token -> Worker verifies token -> stable subscription/config URLs.

The token is not stored in GitHub. This prototype does not claim that a Cloudflare API token alone is a proxy node; a real node/endpoint must be configured before the subscription is usable.
