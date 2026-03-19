# RLS Features (Post-MVP)

## Tables to Create

| Table | Purpose |
|-------|---------|
| `users` | User profiles (extends auth.users) |
| `ideas` | Main ideas/concepts |
| `idea_collaborators` | Shared access control |
| `comments` | Discussion on ideas |
| `tags` | Labeling system |
| `idea_tags` | Junction table |
| `votes` | Upvote/downvote public ideas |

---

## RLS Policies Summary

### users
- SELECT/UPDATE: Own profile only (`auth.uid() = id`)

### ideas
- SELECT: Owner sees all own, public visible to all, collaborators see shared
- INSERT: Authenticated users, must set self as owner
- UPDATE/DELETE: Owner only

### idea_collaborators
- SELECT: Idea owner or self (collaborator)
- INSERT/DELETE: Idea owner only

### comments
- SELECT: If can see parent idea
- INSERT: Authenticated + can see idea
- UPDATE: Own comments only
- DELETE: Own comment OR idea owner (moderation)

### tags
- SELECT: Public (everyone)
- INSERT: Authenticated users

### idea_tags
- SELECT: Based on idea access
- INSERT/DELETE: Idea owner only

### votes
- SELECT: Public ideas only
- INSERT: Authenticated + public ideas
- UPDATE/DELETE: Own vote only

---

## Access Matrix

| Table | Anon | Auth | Collaborator | Owner |
|-------|------|------|--------------|-------|
| users | - | Own | - | Own |
| ideas | Public | Public+own | +shared | Full |
| collaborators | - | - | See self | Full |
| comments | Public | +comment | +shared | +moderate |
| tags | Read | +create | +create | +create |
| votes | Public | +vote | +vote | +vote |

---

## Key SQL Patterns

```sql
-- Check ownership
USING (auth.uid() = user_id)

-- Check collaboration
EXISTS (
  SELECT 1 FROM idea_collaborators
  WHERE idea_id = ideas.id AND user_id = auth.uid()
)

-- Validate insert
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL)
```

---

## Implementation Order
1. Enable RLS on each table after creation
2. Start with `users` and `ideas` policies
3. Add collaboration policies
4. Add comments/votes policies
5. Test each policy before moving on
