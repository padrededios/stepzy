---
name: step-03-integrate
description: Phase d'intégration - tests API et scénarios complets
next_step: steps/step-04-finalize.md
---

# Phase 3: Integrate

**Role: INTEGRATOR** - Connect all pieces and verify end-to-end

---

<available_state>
From previous step:
- All unit tests passing
- Service layer complete
- Validation in place
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 🔌 CONNECT all layers - routes, services, database
- 🧪 TEST API endpoints - real HTTP requests
- 🔄 VERIFY scenarios - complete user flows
- 🔐 CHECK security - auth, validation, errors
- 🚫 FORBIDDEN: Skipping integration tests
</mandatory_rules>

---

## Actions

### 3.1 Créer les routes API

```typescript
// backend/src/routes/{feature}.routes.ts

import { Router } from 'express';
import { {feature}Service } from '../services/{feature}.service';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { create{Feature}Schema, update{Feature}Schema } from '../schemas/{feature}.schema';

const router = Router();

// POST /api/{feature}
router.post('/',
  auth,
  validate(create{Feature}Schema),
  async (req, res, next) => {
    try {
      const result = await {feature}Service.create(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/{feature}/:id
router.get('/:id',
  auth,
  async (req, res, next) => {
    try {
      const result = await {feature}Service.getById(req.params.id);
      if (!result) {
        return res.status(404).json({ success: false, error: 'Not found' });
      }
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/{feature}/:id
router.put('/:id',
  auth,
  validate(update{Feature}Schema),
  async (req, res, next) => {
    try {
      const result = await {feature}Service.update(req.params.id, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/{feature}/:id
router.delete('/:id',
  auth,
  async (req, res, next) => {
    try {
      await {feature}Service.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
```

### 3.2 Écrire les tests d'intégration API

```typescript
// backend/tests/integration/{feature}.api.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { createTestUser, getTestToken, cleanupTestData } from '../helpers';

describe('{Feature} API', () => {
  let token: string;
  let testUserId: string;
  let created{Feature}Id: string;

  beforeAll(async () => {
    const user = await createTestUser();
    testUserId = user.id;
    token = await getTestToken(user);
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('POST /api/{feature}', () => {
    it('should return 201 with valid data', async () => {
      const response = await request(app)
        .post('/api/{feature}')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Feature',
          description: 'Test Description',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: expect.any(String),
        name: 'Test Feature',
      });

      created{Feature}Id = response.body.data.id;
    });

    it('should return 400 with invalid data', async () => {
      const response = await request(app)
        .post('/api/{feature}')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .post('/api/{feature}')
        .send({ name: 'Test' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/{feature}/:id', () => {
    it('should return 200 with existing id', async () => {
      const response = await request(app)
        .get(`/api/{feature}/${created{Feature}Id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(created{Feature}Id);
    });

    it('should return 404 with non-existing id', async () => {
      const response = await request(app)
        .get('/api/{feature}/non-existing-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/{feature}/:id', () => {
    it('should return 200 with valid update', async () => {
      const response = await request(app)
        .put(`/api/{feature}/${created{Feature}Id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Name');
    });
  });

  describe('DELETE /api/{feature}/:id', () => {
    it('should return 204 on successful delete', async () => {
      const response = await request(app)
        .delete(`/api/{feature}/${created{Feature}Id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it('should return 404 when deleting again', async () => {
      const response = await request(app)
        .delete(`/api/{feature}/${created{Feature}Id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});
```

### 3.3 Exécuter les tests d'intégration

```bash
# Run integration tests
npm run test:integration -- --testPathPattern="{feature}"

# Expected: All tests passing
```

### 3.4 Enregistrer les routes

```typescript
// backend/src/app.ts

import {feature}Routes from './routes/{feature}.routes';

// ... existing routes ...

app.use('/api/{feature}', {feature}Routes);
```

---

## Output de cette phase

```markdown
## Integration Report

### API Endpoints Implemented
| Method | Path | Auth | Status |
|--------|------|------|--------|
| POST | /api/{feature} | Required | ✅ |
| GET | /api/{feature}/:id | Required | ✅ |
| PUT | /api/{feature}/:id | Required | ✅ |
| DELETE | /api/{feature}/:id | Required | ✅ |
| GET | /api/{feature} | Required | ✅ |

### Integration Tests
| Endpoint | Tests | Passing |
|----------|-------|---------|
| POST /api/{feature} | 3 | 3 |
| GET /api/{feature}/:id | 2 | 2 |
| PUT /api/{feature}/:id | 2 | 2 |
| DELETE /api/{feature}/:id | 2 | 2 |

### Security Verified
- [ ] Authentication required on all endpoints
- [ ] Authorization checks in place
- [ ] Input validation working
- [ ] Error responses don't leak info

### Test Command
```bash
npm run test:integration -- --testPathPattern="{feature}"
# Result: 9 tests passing
```
```

---

→ **Next**: `step-04-finalize.md` - Final verification
