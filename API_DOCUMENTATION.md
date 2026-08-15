# Laravel Stream — API Documentation

All endpoints are prefixed with `/api`. Responses are JSON.

---

## Authentication

The API uses a simple Bearer token scheme. After registering or logging in, include the returned token on every protected request:

```
Authorization: Bearer <your_api_token>
```

Requests to protected endpoints without a valid token return `401 Unauthenticated`.

---

## Table of Contents

- [App Version](#app-version)
- [Auth](#auth)
- [Profile](#profile)
- [Homepage](#homepage)
- [Movies](#movies)
- [TV Series](#tv-series)
- [Most Watched](#most-watched)
- [Watch Progress](#watch-progress)
- [Wishlist](#wishlist)
- [Comments](#comments)
- [Notifications](#notifications)

---

## App Version

### Get Latest Version

```
GET /api/app/version
```

Returns the latest active app version. Useful for in-app update checks.

**Auth required:** No

**Response `200`**
```json
{
  "version": "1.2.0",
  "version_code": 12,
  "release_notes": "Bug fixes and improvements",
  "apk_url": "https://example.com/storage/app.apk",
  "force_update": false
}
```

If no active version exists: `{ "version": null }`

---

## Auth

### Register

```
POST /api/register
```

**Auth required:** No

**Request body**
| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | Max 255 chars |
| `email` | string | Yes | Unique, valid email |
| `password` | string | Yes | Min 8 chars |
| `password_confirmation` | string | Yes | Must match `password` |

**Response `200`**
```json
{
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "profile_picture": null,
    "is_admin": false,
    "created_at": "2024-01-01T00:00:00.000000Z",
    "updated_at": "2024-01-01T00:00:00.000000Z"
  },
  "token": "<80-char api token>"
}
```

---

### Login

```
POST /api/login
```

**Auth required:** No

**Request body**
| Field | Type | Required |
|---|---|---|
| `email` | string | Yes |
| `password` | string | Yes |

**Response `200`** — same shape as Register

**Response `422`** — invalid credentials

---

### Get Authenticated User

```
GET /api/user
```

**Auth required:** Yes

**Response `200`** — the authenticated user object (same shape as register response `user`)

---

### Logout

```
POST /api/logout
```

**Auth required:** Yes

Invalidates the current token.

**Response `200`**
```json
{ "message": "Logged out successfully" }
```

---

## Profile

### Update Profile

```
POST /api/user/update
```

**Auth required:** Yes

**Request body** (multipart/form-data)
| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | Max 255 chars |
| `profile_picture` | file | No | Image, max 2 MB |

**Response `200`**
```json
{
  "message": "Profile updated successfully",
  "user": { ... }
}
```

---

## Homepage

### Get Homepage Sections

```
GET /api/
```

**Auth required:** No

Returns all active homepage sections. Each section is either sourced from TMDB or from custom admin-curated items.

**Response `200`**
```json
{
  "hero_carousel": {
    "title": "Featured",
    "source": "tmdb",
    "items": [ <MediaItem>, ... ]
  },
  "most_favorite": {
    "title": "Most Favorite",
    "source": "wishlist",
    "movies": [ <MediaItem>, ... ],
    "tv": [ <MediaItem>, ... ]
  },
  "now_playing": {
    "title": "Now Playing",
    "source": "tmdb",
    "movies": [ <MediaItem>, ... ],
    "tv": [ <MediaItem>, ... ]
  },
  "popular": { ... },
  "top_rated": { ... },
  "upcoming": { ... }
}
```

**MediaItem object**
```json
{
  "id": 550,
  "type": "movie",
  "title": "Fight Club",
  "overview": "A ticking-time-bomb insomniac...",
  "poster_url": "https://image.tmdb.org/t/p/w500/...",
  "backdrop_url": "https://image.tmdb.org/t/p/original/...",
  "vote_average": 8.4,
  "release_date": "1999-10-15"
}
```

Hero carousel items also include `"tagline"`. `most_favorite` items also include `"favorite_count"`.

---

## Movies

### List Movies

```
GET /api/movies?page=1
```

**Auth required:** No

Returns a paginated list of movies from TMDB Discover.

**Query parameters**
| Param | Type | Default | Notes |
|---|---|---|---|
| `page` | integer | 1 | Min 1 |

**Response `200`**
```json
{
  "data": [ <MediaItem>, ... ],
  "meta": {
    "page": 1,
    "total_pages": 500,
    "total_results": 10000
  }
}
```

---

### Get Movie Detail

```
GET /api/movie/{tmdb_id}
```

**Auth required:** No

**Path parameters**
| Param | Type | Notes |
|---|---|---|
| `tmdb_id` | integer | TMDB movie ID |

**Response `200`**
```json
{
  "id": 550,
  "type": "movie",
  "title": "Fight Club",
  "original_title": "Fight Club",
  "overview": "...",
  "tagline": "...",
  "poster_url": "...",
  "backdrop_url": "...",
  "vote_average": 8.4,
  "vote_count": 26000,
  "popularity": 61.4,
  "release_date": "1999-10-15",
  "runtime": 139,
  "status": "Released",
  "adult": false,
  "original_language": "en",
  "homepage": "https://...",
  "budget": 63000000,
  "revenue": 101200000,
  "imdb_id": "tt0137523",
  "external_ids": { "imdb_id": "tt0137523", "wikidata_id": "..." },
  "genres": [ { "id": 18, "name": "Drama" } ],
  "production_companies": [ { "id": 508, "name": "Regency...", "logo_url": "...", "origin_country": "US" } ],
  "production_countries": [ { "iso_3166_1": "US", "name": "United States of America" } ],
  "spoken_languages": [ { "iso_639_1": "en", "name": "English" } ],
  "collection": null,
  "keywords": [ { "id": 123, "name": "based on novel" } ],
  "cast": [ { "id": 819, "name": "Edward Norton", "character": "The Narrator", "profile_url": "...", "order": 0 } ],
  "videos": [ { "id": "abc", "name": "Trailer", "key": "SUXWAEX2jlg", "site": "YouTube", "type": "Trailer", "official": true, "url": "https://www.youtube.com/watch?v=SUXWAEX2jlg" } ],
  "recommendations": [ <MediaItem>, ... ],
  "similar": [ <MediaItem>, ... ]
}
```

**Response `404`** — `{ "message": "Movie not found." }`

---

## TV Series

### List TV Series

```
GET /api/tvseries?page=1
```

**Auth required:** No

Returns a paginated list of TV series from TMDB Discover. Same shape as [List Movies](#list-movies).

---

### Get TV Series Detail

```
GET /api/tv/{tmdb_id}
```

**Auth required:** No

**Path parameters**
| Param | Type | Notes |
|---|---|---|
| `tmdb_id` | integer | TMDB TV series ID |

**Response `200`**
```json
{
  "id": 1396,
  "type": "tv",
  "title": "Breaking Bad",
  "original_title": "Breaking Bad",
  "overview": "...",
  "tagline": "...",
  "poster_url": "...",
  "backdrop_url": "...",
  "vote_average": 9.5,
  "vote_count": 13000,
  "popularity": 369.0,
  "release_date": "2008-01-20",
  "last_air_date": "2013-09-29",
  "number_of_seasons": 5,
  "number_of_episodes": 62,
  "episode_run_time": [45, 47],
  "status": "Ended",
  "in_production": false,
  "adult": false,
  "original_language": "en",
  "homepage": "https://...",
  "series_type": "Scripted",
  "imdb_id": "tt0903747",
  "external_ids": { "imdb_id": "tt0903747" },
  "genres": [ { "id": 18, "name": "Drama" } ],
  "networks": [ { "id": 174, "name": "AMC", "logo_url": "...", "origin_country": "US" } ],
  "production_companies": [ ... ],
  "production_countries": [ ... ],
  "spoken_languages": [ ... ],
  "origin_country": ["US"],
  "created_by": [ { "id": 66633, "name": "Vince Gilligan", "profile_url": "..." } ],
  "languages": ["en"],
  "keywords": [ ... ],
  "cast": [ { "id": 17419, "name": "Bryan Cranston", "character": "Walter White", "profile_url": "...", "order": 0 } ],
  "videos": [ ... ],
  "recommendations": [ <MediaItem>, ... ],
  "similar": [ <MediaItem>, ... ],
  "seasons": [
    {
      "id": 3572,
      "name": "Season 1",
      "season_number": 1,
      "episode_count": 7,
      "air_date": "2008-01-20",
      "overview": "...",
      "poster_url": "...",
      "episodes": [
        {
          "id": 62085,
          "name": "Pilot",
          "overview": "...",
          "episode_number": 1,
          "season_number": 1,
          "air_date": "2008-01-20",
          "runtime": 58,
          "vote_average": 7.7,
          "vote_count": 200,
          "still_url": "...",
          "production_code": "",
          "guest_stars": [ ... ]
        }
      ]
    }
  ]
}
```

**Response `404`** — `{ "message": "TV series not found." }`

---

## Most Watched

### List Most Watched

```
GET /api/most-watched
```

**Auth required:** No

Returns the top 20 most watched titles, ordered by `watch_count` descending.

**Response `200`**
```json
[
  {
    "id": 1,
    "type": "movie",
    "tmdb_id": 550,
    "title": "Fight Club",
    "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    "vote_average": 8.4,
    "release_year": 1999,
    "watch_count": 42,
    "created_at": "...",
    "updated_at": "..."
  }
]
```

`vote_average` and `release_year` are `null` for records that were created before these fields were added.

---

### Increment Watch Count

```
POST /api/most-watched/increment
```

**Auth required:** No

Call this when a user starts or resumes watching a title to increment its global watch counter. Metadata fields are updated on every call so stale values are corrected over time.

**Request body**
| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | string | Yes | `movie` or `tv` |
| `tmdb_id` | integer | Yes | |
| `title` | string | No | |
| `poster_path` | string | No | Raw TMDB path, e.g. `/abc.jpg` |
| `vote_average` | numeric | No | 0–10 |
| `release_date` | string | No | Any date string — only the 4-digit year is stored |

**Response `200`** — the updated MostWatched record (same shape as the list above)

---

## Watch Progress

All Watch Progress endpoints require authentication.

### List Watch Progress

```
GET /api/watch-progress
```

**Auth required:** Yes

Returns all watch progress records for the authenticated user, sorted by most recently updated.

**Response `200`**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "type": "tv",
    "tmdb_id": 1396,
    "title": "Breaking Bad",
    "poster_path": "/...",
    "season": 1,
    "episode": 3,
    "position_seconds": 1240,
    "duration_seconds": 2760,
    "created_at": "...",
    "updated_at": "..."
  }
]
```

---

### Get Progress for a Single Title

```
GET /api/watch-progress/{type}/{tmdb_id}
```

**Auth required:** Yes

Returns the most recently updated progress record for a specific title. For TV shows, this is the most recently watched episode — useful for showing a "Resume" button on detail screens.

**Path parameters**
| Param | Type | Notes |
|---|---|---|
| `type` | string | `movie` or `tv` |
| `tmdb_id` | integer | |

**Response `200`** — a single progress record (same shape as the list), or `null` if no progress exists

---

### Save / Update Watch Progress

```
POST /api/watch-progress
```

**Auth required:** Yes

Creates or updates the progress for a specific title (matched on `type`, `tmdb_id`, `season`, and `episode`).

**Request body**
| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | string | Yes | `movie` or `tv` |
| `tmdb_id` | integer | Yes | |
| `title` | string | No | |
| `poster_path` | string | No | |
| `season` | integer | No | For TV only |
| `episode` | integer | No | For TV only |
| `position_seconds` | integer | Yes | Current playback position |
| `duration_seconds` | integer | Yes | Total duration |

**Response `200`** — the created or updated progress record

---

### Delete Watch Progress

```
DELETE /api/watch-progress/{type}/{tmdb_id}
```

**Auth required:** Yes

**Path parameters**
| Param | Type | Notes |
|---|---|---|
| `type` | string | `movie` or `tv` |
| `tmdb_id` | integer | |

**Query parameters** (optional, for TV)
| Param | Type | Notes |
|---|---|---|
| `season` | integer | Targets a specific season |
| `episode` | integer | Targets a specific episode |

**Response `200`**
```json
{ "message": "Removed" }
```

---

## Wishlist

All Wishlist endpoints require authentication.

### List Wishlist

```
GET /api/wishlist
```

**Auth required:** Yes

Returns all wishlist items for the authenticated user, sorted by most recently added.

**Response `200`**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "type": "movie",
    "tmdb_id": 550,
    "title": "Fight Club",
    "poster_path": "/...",
    "vote_average": 8.4,
    "release_date": "1999-10-15",
    "created_at": "...",
    "updated_at": "..."
  }
]
```

---

### Add to Wishlist

```
POST /api/wishlist
```

**Auth required:** Yes

Adds or updates a title in the user's wishlist.

**Request body**
| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | string | Yes | `movie` or `tv` |
| `tmdb_id` | integer | Yes | |
| `title` | string | No | |
| `poster_path` | string | No | |
| `vote_average` | numeric | No | |
| `release_date` | string | No | |

**Response `200`** — the created or updated wishlist item

---

### Check Wishlist Status

```
GET /api/wishlist/{type}/{tmdb_id}
```

**Auth required:** Yes

Checks whether a specific title is in the user's wishlist.

**Path parameters**
| Param | Type | Notes |
|---|---|---|
| `type` | string | `movie` or `tv` |
| `tmdb_id` | integer | |

**Response `200`**
```json
{ "in_wishlist": true }
```

---

### Remove from Wishlist

```
DELETE /api/wishlist/{type}/{tmdb_id}
```

**Auth required:** Yes

**Path parameters**
| Param | Type | Notes |
|---|---|---|
| `type` | string | `movie` or `tv` |
| `tmdb_id` | integer | |

**Response `200`**
```json
{ "message": "Removed" }
```

---

## Comments

Comments are threaded — top-level comments can have replies. Reading is public; writing requires authentication.

When a user posts a comment they are automatically subscribed to the thread. Posting a reply targets the top-level comment's thread, not a further nesting level.

**Comment object**
```json
{
  "id": 12,
  "body": "One of the best films ever made.",
  "parent_id": null,
  "created_at": "2024-01-15T10:30:00.000000Z",
  "updated_at": "2024-01-15T10:30:00.000000Z",
  "is_mine": true,
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "profile_picture": null
  },
  "replies": [ <Comment>, ... ],
  "reply_count": 2
}
```

`is_mine` is `true` when the authenticated user owns the comment. It is always `false` for unauthenticated requests.

---

### List Comments

```
GET /api/comments/{type}/{tmdb_id}?page=1
```

**Auth required:** No (pass token to receive correct `is_mine` and `is_following` values)

Returns paginated top-level comments with their replies nested inline, newest first.

**Path parameters**
| Param | Type | Notes |
|---|---|---|
| `type` | string | `movie` or `tv` |
| `tmdb_id` | integer | |

**Query parameters**
| Param | Type | Default |
|---|---|---|
| `page` | integer | 1 |

**Response `200`**
```json
{
  "data": [ <Comment>, ... ],
  "meta": {
    "current_page": 1,
    "last_page": 3,
    "total": 54
  },
  "is_following": false
}
```

`is_following` indicates whether the authenticated user is subscribed to new-comment notifications for this thread. Always `false` for unauthenticated requests.

---

### Post a Comment or Reply

```
POST /api/comments/{type}/{tmdb_id}
```

**Auth required:** Yes

Posts a new top-level comment or a reply to an existing comment. The user is automatically subscribed to the thread on their first comment.

**Path parameters**
| Param | Type | Notes |
|---|---|---|
| `type` | string | `movie` or `tv` |
| `tmdb_id` | integer | |

**Request body**
| Field | Type | Required | Notes |
|---|---|---|---|
| `body` | string | Yes | Max 1000 chars |
| `parent_id` | integer | No | ID of the comment being replied to; must belong to the same thread |
| `media_title` | string | No | Title of the movie/show — used in notification text |

**Response `201`** — the created Comment object

**Response `422`** — `parent_id` does not belong to this thread

---

### Delete a Comment

```
DELETE /api/comments/{comment_id}
```

**Auth required:** Yes

Deletes a comment the authenticated user owns. Replies are cascade-deleted by the database.

**Path parameters**
| Param | Type | Notes |
|---|---|---|
| `comment_id` | integer | |

**Response `200`**
```json
{ "message": "Comment deleted." }
```

**Response `403`** — comment belongs to another user

---

### Follow a Thread

```
POST /api/comments/{type}/{tmdb_id}/follow
```

**Auth required:** Yes

Subscribe to new-comment notifications for this thread without posting a comment first.

**Path parameters**
| Param | Type | Notes |
|---|---|---|
| `type` | string | `movie` or `tv` |
| `tmdb_id` | integer | |

**Response `200`**
```json
{ "is_following": true }
```

---

### Unfollow a Thread

```
DELETE /api/comments/{type}/{tmdb_id}/follow
```

**Auth required:** Yes

Unsubscribe from new-comment notifications for this thread.

**Response `200`**
```json
{ "is_following": false }
```

---

## Notifications

Notifications are created when someone comments on a thread you follow (either by commenting yourself or by explicitly following). All notification endpoints require authentication.

**Notification object**
```json
{
  "id": "uuid-string",
  "data": {
    "comment_id": 42,
    "commenter_id": 7,
    "commenter_name": "John Smith",
    "media_type": "movie",
    "tmdb_id": 550,
    "media_title": "Fight Club",
    "body_preview": "One of the best films ever made.",
    "parent_id": null
  },
  "read_at": null,
  "created_at": "2024-01-15T10:30:00.000000Z"
}
```

`read_at` is `null` for unread notifications and an ISO timestamp once marked read. `parent_id` in `data` is non-null when the triggering comment was a reply.

---

### List Notifications

```
GET /api/notifications?page=1
```

**Auth required:** Yes

Returns paginated notifications for the authenticated user, newest first.

**Query parameters**
| Param | Type | Default |
|---|---|---|
| `page` | integer | 1 |

**Response `200`**
```json
{
  "data": [ <Notification>, ... ],
  "meta": {
    "current_page": 1,
    "last_page": 2,
    "total": 38,
    "unread_count": 5
  }
}
```

`unread_count` in `meta` always reflects the current total number of unread notifications, not just the count on the current page.

---

### Get Unread Count

```
GET /api/notifications/unread-count
```

**Auth required:** Yes

Lightweight endpoint for polling the notification badge. Returns only the unread count without fetching notification content.

**Response `200`**
```json
{ "unread_count": 5 }
```

---

### Mark a Notification as Read

```
POST /api/notifications/{notification_id}/read
```

**Auth required:** Yes

**Path parameters**
| Param | Type | Notes |
|---|---|---|
| `notification_id` | string | UUID of the notification |

**Response `200`**
```json
{ "message": "Marked as read." }
```

**Response `404`** — notification not found or belongs to another user

---

### Mark All Notifications as Read

```
POST /api/notifications/read-all
```

**Auth required:** Yes

Marks every unread notification for the authenticated user as read in a single call.

**Response `200`**
```json
{ "message": "All marked as read." }
```

---

## Error Responses

| Status | Meaning |
|---|---|
| `401` | Missing or invalid Bearer token |
| `403` | Forbidden (admin-only route, or trying to delete another user's comment) |
| `404` | Resource not found |
| `422` | Validation error — body contains a `message` and `errors` map |
| `503` | Server-side runtime error |

**Validation error shape**
```json
{
  "message": "The email field is required.",
  "errors": {
    "email": ["The email field is required."]
  }
}
```

## App Version

### Get Latest Version

```
GET /api/app/version
```

Returns the latest active app version. Useful for in-app update checks.

**Auth required:** No

**Response `200`**
```json
{
  "version": "1.2.0",
  "version_code": 12,
  "release_notes": "Bug fixes and improvements",
  "apk_url": "https://example.com/storage/app.apk",
  "force_update": false
}
```

If no active version exists: `{ "version": null }`

---

## Auth

### Register

```
POST /api/register
```

**Auth required:** No

**Request body**
| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | Max 255 chars |
| `email` | string | Yes | Unique, valid email |
| `password` | string | Yes | Min 8 chars |
| `password_confirmation` | string | Yes | Must match `password` |

**Response `200`**
```json
{
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "profile_picture": null,
    "is_admin": false,
    "created_at": "2024-01-01T00:00:00.000000Z",
    "updated_at": "2024-01-01T00:00:00.000000Z"
  },
  "token": "<80-char api token>"
}
```

---

### Login

```
POST /api/login
```

**Auth required:** No

**Request body**
| Field | Type | Required |
|---|---|---|
| `email` | string | Yes |
| `password` | string | Yes |

**Response `200`** — same shape as Register

**Response `422`** — invalid credentials

---

### Get Authenticated User

```
GET /api/user
```

**Auth required:** Yes

**Response `200`** — the authenticated user object (same shape as register response `user`)

---

### Logout

```
POST /api/logout
```

**Auth required:** Yes

Invalidates the current token.

**Response `200`**
```json
{ "message": "Logged out successfully" }
```

---

## Profile

### Update Profile

```
POST /api/user/update
```

**Auth required:** Yes

**Request body** (multipart/form-data)
| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | Max 255 chars |
| `profile_picture` | file | No | Image, max 2 MB |

**Response `200`**
```json
{
  "message": "Profile updated successfully",
  "user": { ... }
}
```

---

## Homepage

### Get Homepage Sections

```
GET /api/
```

**Auth required:** No

Returns all active homepage sections. Each section is either sourced from TMDB or from custom admin-curated items.

**Response `200`**
```json
{
  "hero_carousel": {
    "title": "Featured",
    "source": "tmdb",
    "items": [ <MediaItem>, ... ]
  },
  "most_favorite": {
    "title": "Most Favorite",
    "source": "wishlist",
    "movies": [ <MediaItem>, ... ],
    "tv": [ <MediaItem>, ... ]
  },
  "now_playing": {
    "title": "Now Playing",
    "source": "tmdb",
    "movies": [ <MediaItem>, ... ],
    "tv": [ <MediaItem>, ... ]
  },
  "popular": { ... },
  "top_rated": { ... },
  "upcoming": { ... }
}
```

**MediaItem object**
```json
{
  "id": 550,
  "type": "movie",
  "title": "Fight Club",
  "overview": "A ticking-time-bomb insomniac...",
  "poster_url": "https://image.tmdb.org/t/p/w500/...",
  "backdrop_url": "https://image.tmdb.org/t/p/original/...",
  "vote_average": 8.4,
  "release_date": "1999-10-15"
}
```

Hero carousel items also include `"tagline"`. `most_favorite` items also include `"favorite_count"`.

---

## Movies

### List Movies

```
GET /api/movies?page=1
```

**Auth required:** No

Returns a paginated list of movies from TMDB Discover.

**Query parameters**
| Param | Type | Default | Notes |
|---|---|---|---|
| `page` | integer | 1 | Min 1 |

**Response `200`**
```json
{
  "data": [ <MediaItem>, ... ],
  "meta": {
    "page": 1,
    "total_pages": 500,
    "total_results": 10000
  }
}
```

---

### Get Movie Detail

```
GET /api/movie/{tmdb_id}
```

**Auth required:** No

**Path parameters**
| Param | Type | Notes |
|---|---|---|
| `tmdb_id` | integer | TMDB movie ID |

**Response `200`**
```json
{
  "id": 550,
  "type": "movie",
  "title": "Fight Club",
  "original_title": "Fight Club",
  "overview": "...",
  "tagline": "...",
  "poster_url": "...",
  "backdrop_url": "...",
  "vote_average": 8.4,
  "vote_count": 26000,
  "popularity": 61.4,
  "release_date": "1999-10-15",
  "runtime": 139,
  "status": "Released",
  "adult": false,
  "original_language": "en",
  "homepage": "https://...",
  "budget": 63000000,
  "revenue": 101200000,
  "imdb_id": "tt0137523",
  "external_ids": { "imdb_id": "tt0137523", "wikidata_id": "..." },
  "genres": [ { "id": 18, "name": "Drama" } ],
  "production_companies": [ { "id": 508, "name": "Regency...", "logo_url": "...", "origin_country": "US" } ],
  "production_countries": [ { "iso_3166_1": "US", "name": "United States of America" } ],
  "spoken_languages": [ { "iso_639_1": "en", "name": "English" } ],
  "collection": null,
  "keywords": [ { "id": 123, "name": "based on novel" } ],
  "cast": [ { "id": 819, "name": "Edward Norton", "character": "The Narrator", "profile_url": "...", "order": 0 } ],
  "videos": [ { "id": "abc", "name": "Trailer", "key": "SUXWAEX2jlg", "site": "YouTube", "type": "Trailer", "official": true, "url": "https://www.youtube.com/watch?v=SUXWAEX2jlg" } ],
  "recommendations": [ <MediaItem>, ... ],
  "similar": [ <MediaItem>, ... ]
}
```

**Response `404`** — `{ "message": "Movie not found." }`

---

## TV Series

### List TV Series

```
GET /api/tvseries?page=1
```

**Auth required:** No

Returns a paginated list of TV series from TMDB Discover. Same shape as [List Movies](#list-movies).

---

### Get TV Series Detail

```
GET /api/tv/{tmdb_id}
```

**Auth required:** No

**Path parameters**
| Param | Type | Notes |
|---|---|---|
| `tmdb_id` | integer | TMDB TV series ID |

**Response `200`**
```json
{
  "id": 1396,
  "type": "tv",
  "title": "Breaking Bad",
  "original_title": "Breaking Bad",
  "overview": "...",
  "tagline": "...",
  "poster_url": "...",
  "backdrop_url": "...",
  "vote_average": 9.5,
  "vote_count": 13000,
  "popularity": 369.0,
  "release_date": "2008-01-20",
  "last_air_date": "2013-09-29",
  "number_of_seasons": 5,
  "number_of_episodes": 62,
  "episode_run_time": [45, 47],
  "status": "Ended",
  "in_production": false,
  "adult": false,
  "original_language": "en",
  "homepage": "https://...",
  "series_type": "Scripted",
  "imdb_id": "tt0903747",
  "external_ids": { "imdb_id": "tt0903747" },
  "genres": [ { "id": 18, "name": "Drama" } ],
  "networks": [ { "id": 174, "name": "AMC", "logo_url": "...", "origin_country": "US" } ],
  "production_companies": [ ... ],
  "production_countries": [ ... ],
  "spoken_languages": [ ... ],
  "origin_country": ["US"],
  "created_by": [ { "id": 66633, "name": "Vince Gilligan", "profile_url": "..." } ],
  "languages": ["en"],
  "keywords": [ ... ],
  "cast": [ { "id": 17419, "name": "Bryan Cranston", "character": "Walter White", "profile_url": "...", "order": 0 } ],
  "videos": [ ... ],
  "recommendations": [ <MediaItem>, ... ],
  "similar": [ <MediaItem>, ... ],
  "seasons": [
    {
      "id": 3572,
      "name": "Season 1",
      "season_number": 1,
      "episode_count": 7,
      "air_date": "2008-01-20",
      "overview": "...",
      "poster_url": "...",
      "episodes": [
        {
          "id": 62085,
          "name": "Pilot",
          "overview": "...",
          "episode_number": 1,
          "season_number": 1,
          "air_date": "2008-01-20",
          "runtime": 58,
          "vote_average": 7.7,
          "vote_count": 200,
          "still_url": "...",
          "production_code": "",
          "guest_stars": [ ... ]
        }
      ]
    }
  ]
}
```

**Response `404`** — `{ "message": "TV series not found." }`

---

## Most Watched

### List Most Watched

```
GET /api/most-watched
```

**Auth required:** No

Returns the top 20 most watched titles, ordered by `watch_count` descending.

**Response `200`**
```json
[
  {
    "id": 1,
    "type": "movie",
    "tmdb_id": 550,
    "title": "Fight Club",
    "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    "vote_average": 8.4,
    "release_year": 1999,
    "watch_count": 42,
    "created_at": "...",
    "updated_at": "..."
  }
]
```

`vote_average` and `release_year` are `null` for records that were created before these fields were added.

---

### Increment Watch Count

```
POST /api/most-watched/increment
```

**Auth required:** No

Call this when a user starts or resumes watching a title to increment its global watch counter. Metadata fields are updated on every call so stale values are corrected over time.

**Request body**
| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | string | Yes | `movie` or `tv` |
| `tmdb_id` | integer | Yes | |
| `title` | string | No | |
| `poster_path` | string | No | Raw TMDB path, e.g. `/abc.jpg` |
| `vote_average` | numeric | No | 0–10 |
| `release_date` | string | No | Any date string — only the 4-digit year is stored |

**Response `200`** — the updated MostWatched record (same shape as the list above)

---

## Watch Progress

All Watch Progress endpoints require authentication.

### List Watch Progress

```
GET /api/watch-progress
```

**Auth required:** Yes

Returns all watch progress records for the authenticated user, sorted by most recently updated.

**Response `200`**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "type": "tv",
    "tmdb_id": 1396,
    "title": "Breaking Bad",
    "poster_path": "/...",
    "season": 1,
    "episode": 3,
    "position_seconds": 1240,
    "duration_seconds": 2760,
    "created_at": "...",
    "updated_at": "..."
  }
]
```

---

### Get Progress for a Single Title

```
GET /api/watch-progress/{type}/{tmdb_id}
```

**Auth required:** Yes

Returns the most recently updated progress record for a specific title. For TV shows, this is the most recently watched episode — useful for showing a "Resume" button on detail screens.

**Path parameters**
| Param | Type | Notes |
|---|---|---|
| `type` | string | `movie` or `tv` |
| `tmdb_id` | integer | |

**Response `200`** — a single progress record (same shape as the list), or `null` if no progress exists

---

### Save / Update Watch Progress

```
POST /api/watch-progress
```

**Auth required:** Yes

Creates or updates the progress for a specific title (matched on `type`, `tmdb_id`, `season`, and `episode`).

**Request body**
| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | string | Yes | `movie` or `tv` |
| `tmdb_id` | integer | Yes | |
| `title` | string | No | |
| `poster_path` | string | No | |
| `season` | integer | No | For TV only |
| `episode` | integer | No | For TV only |
| `position_seconds` | integer | Yes | Current playback position |
| `duration_seconds` | integer | Yes | Total duration |

**Response `200`** — the created or updated progress record

---

### Delete Watch Progress

```
DELETE /api/watch-progress/{type}/{tmdb_id}
```

**Auth required:** Yes

**Path parameters**
| Param | Type | Notes |
|---|---|---|
| `type` | string | `movie` or `tv` |
| `tmdb_id` | integer | |

**Query parameters** (optional, for TV)
| Param | Type | Notes |
|---|---|---|
| `season` | integer | Targets a specific season |
| `episode` | integer | Targets a specific episode |

**Response `200`**
```json
{ "message": "Removed" }
```

---

## Wishlist

All Wishlist endpoints require authentication.

### List Wishlist

```
GET /api/wishlist
```

**Auth required:** Yes

Returns all wishlist items for the authenticated user, sorted by most recently added.

**Response `200`**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "type": "movie",
    "tmdb_id": 550,
    "title": "Fight Club",
    "poster_path": "/...",
    "vote_average": 8.4,
    "release_date": "1999-10-15",
    "created_at": "...",
    "updated_at": "..."
  }
]
```

---

### Add to Wishlist

```
POST /api/wishlist
```

**Auth required:** Yes

Adds or updates a title in the user's wishlist.

**Request body**
| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | string | Yes | `movie` or `tv` |
| `tmdb_id` | integer | Yes | |
| `title` | string | No | |
| `poster_path` | string | No | |
| `vote_average` | numeric | No | |
| `release_date` | string | No | |

**Response `200`** — the created or updated wishlist item

---

### Check Wishlist Status

```
GET /api/wishlist/{type}/{tmdb_id}
```

**Auth required:** Yes

Checks whether a specific title is in the user's wishlist.

**Path parameters**
| Param | Type | Notes |
|---|---|---|
| `type` | string | `movie` or `tv` |
| `tmdb_id` | integer | |

**Response `200`**
```json
{ "in_wishlist": true }
```

---

### Remove from Wishlist

```
DELETE /api/wishlist/{type}/{tmdb_id}
```

**Auth required:** Yes

**Path parameters**
| Param | Type | Notes |
|---|---|---|
| `type` | string | `movie` or `tv` |
| `tmdb_id` | integer | |

**Response `200`**
```json
{ "message": "Removed" }
```

---

## Error Responses

| Status | Meaning |
|---|---|
| `401` | Missing or invalid Bearer token |
| `403` | Forbidden (admin-only route) |
| `404` | Resource not found |
| `422` | Validation error — body contains a `message` and `errors` map |
| `503` | Server-side runtime error |

**Validation error shape**
```json
{
  "message": "The email field is required.",
  "errors": {
    "email": ["The email field is required."]
  }
}
```
