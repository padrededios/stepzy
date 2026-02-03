/**
 * Announcements/News routes
 */

import type { FastifyInstance } from 'fastify'
import { AnnouncementService } from '../services/announcement.service'
import { requireAuth, requireAdmin } from '../middleware/auth.middleware'
import { validate, commonSchemas } from '../middleware/validation.middleware'
import { z } from 'zod'

// Validation schemas
const announcementQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(20),
  includeInactive: z.string().transform(val => val === 'true').optional()
})

const createAnnouncementSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10).max(5000),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal')
})

const updateAnnouncementSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  content: z.string().min(10).max(5000).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  active: z.boolean().optional()
})

export async function announcementsRoutes(fastify: FastifyInstance) {
  // GET /api/announcements - Get active announcements (for all users)
  fastify.get('/api/announcements', {
    preHandler: [requireAuth, validate({ query: announcementQuerySchema })]
  }, async (request, reply) => {
    try {
      const query = request.query as z.infer<typeof announcementQuerySchema>

      const announcements = await AnnouncementService.getActive(query.limit)

      return reply.send({
        success: true,
        data: { announcements }
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la récupération des actualités'
      })
    }
  })

  // GET /api/announcements/count - Get recent announcements count
  fastify.get('/api/announcements/count', {
    preHandler: requireAuth
  }, async (request, reply) => {
    try {
      const count = await AnnouncementService.getRecentCount()

      return reply.send({
        success: true,
        data: { count }
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors du comptage des actualités'
      })
    }
  })

  // GET /api/announcements/:id - Get single announcement
  fastify.get('/api/announcements/:id', {
    preHandler: [requireAuth, validate({ params: commonSchemas.idParam })]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const announcement = await AnnouncementService.getById(id)

      if (!announcement) {
        return reply.status(404).send({
          success: false,
          error: 'Actualité non trouvée'
        })
      }

      return reply.send({
        success: true,
        data: { announcement }
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la récupération de l\'actualité'
      })
    }
  })

  // POST /api/announcements - Create announcement (admin only)
  fastify.post('/api/announcements', {
    preHandler: [requireAuth, requireAdmin, validate({ body: createAnnouncementSchema })]
  }, async (request, reply) => {
    try {
      const body = request.body as z.infer<typeof createAnnouncementSchema>

      const announcement = await AnnouncementService.create({
        title: body.title,
        content: body.content,
        priority: body.priority,
        authorId: request.user!.id
      })

      return reply.status(201).send({
        success: true,
        data: { announcement },
        message: 'Actualité créée avec succès'
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la création de l\'actualité'
      })
    }
  })

  // PUT /api/announcements/:id - Update announcement (admin only)
  fastify.put('/api/announcements/:id', {
    preHandler: [requireAuth, requireAdmin, validate({ params: commonSchemas.idParam, body: updateAnnouncementSchema })]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = request.body as z.infer<typeof updateAnnouncementSchema>

      const existing = await AnnouncementService.getById(id)
      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: 'Actualité non trouvée'
        })
      }

      const announcement = await AnnouncementService.update(id, body)

      return reply.send({
        success: true,
        data: { announcement },
        message: 'Actualité mise à jour avec succès'
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la mise à jour de l\'actualité'
      })
    }
  })

  // DELETE /api/announcements/:id - Delete announcement (admin only)
  fastify.delete('/api/announcements/:id', {
    preHandler: [requireAuth, requireAdmin, validate({ params: commonSchemas.idParam })]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const existing = await AnnouncementService.getById(id)
      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: 'Actualité non trouvée'
        })
      }

      await AnnouncementService.delete(id)

      return reply.send({
        success: true,
        message: 'Actualité supprimée avec succès'
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la suppression de l\'actualité'
      })
    }
  })

  // GET /api/admin/announcements - Get all announcements including inactive (admin only)
  fastify.get('/api/admin/announcements', {
    preHandler: [requireAuth, requireAdmin, validate({ query: announcementQuerySchema })]
  }, async (request, reply) => {
    try {
      const query = request.query as z.infer<typeof announcementQuerySchema>

      const announcements = await AnnouncementService.getAll({
        includeInactive: query.includeInactive,
        limit: query.limit
      })

      return reply.send({
        success: true,
        data: { announcements }
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la récupération des actualités'
      })
    }
  })
}
