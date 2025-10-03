import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { requireAdmin, canAccessResource } from '@/lib/middleware/auth';
import { generateAvatarUrl } from '@/lib/auth/validators';

// GET /api/admin/users/[id] - Récupérer un utilisateur spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAdmin(request, async (req, context) => {
    try {
      const { id: userId } = await params;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          pseudo: true,
          avatar: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              matchPlayers: true,
              sessions: true,
            },
          },
          matchPlayers: {
            take: 5,
            orderBy: { joinedAt: 'desc' },
            include: {
              match: {
                select: {
                  id: true,
                  date: true,
                  status: true,
                },
              },
            },
          },
          sessions: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              token: true,
              expiresAt: true,
              ipAddress: true,
              userAgent: true,
              createdAt: true,
            },
          },
        },
      });

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: 'Utilisateur non trouvé',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      console.error('Admin user detail error:', error);
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la récupération de l'utilisateur",
        },
        { status: 500 }
      );
    }
  });
}

// PUT /api/admin/users/[id] - Mettre à jour un utilisateur
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAdmin(request, async (req, context) => {
    try {
      const { id: userId } = await params;
      const body = await req.json();
      const { email, pseudo, avatar, role } = body;

      // Vérifier que l'utilisateur existe
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: 'Utilisateur non trouvé',
          },
          { status: 404 }
        );
      }

      // Validation des données
      const updateData: any = {};

      if (email && email !== existingUser.email) {
        // Vérifier que le nouvel email n'est pas déjà utilisé
        const emailExists = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (emailExists) {
          return NextResponse.json(
            {
              success: false,
              error: 'Un utilisateur avec cet email existe déjà',
            },
            { status: 409 }
          );
        }

        updateData.email = email.toLowerCase();
      }

      if (pseudo && pseudo !== existingUser.pseudo) {
        updateData.pseudo = pseudo;

        // Si pas d'avatar fourni et le pseudo change, générer un nouvel avatar
        if (!avatar && !body.hasOwnProperty('avatar')) {
          updateData.avatar = generateAvatarUrl(pseudo);
        }
      }

      if (body.hasOwnProperty('avatar')) {
        updateData.avatar = avatar;
      }

      if (
        role &&
        ['user', 'root'].includes(role) &&
        role !== existingUser.role
      ) {
        // Empêcher la suppression du dernier admin
        if (existingUser.role === 'root' && role !== 'root') {
          const adminCount = await prisma.user.count({
            where: { role: 'root' },
          });

          if (adminCount <= 1) {
            return NextResponse.json(
              {
                success: false,
                error: 'Impossible de supprimer le dernier administrateur',
              },
              { status: 400 }
            );
          }
        }

        updateData.role = role;
      }

      // Mettre à jour l'utilisateur
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          pseudo: true,
          avatar: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Utilisateur mis à jour avec succès',
        data: { user: updatedUser },
      });
    } catch (error) {
      console.error('Admin user update error:', error);
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la mise à jour de l'utilisateur",
        },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/admin/users/[id] - Supprimer un utilisateur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAdmin(request, async (req, context) => {
    try {
      const { id: userId } = await params;

      // Vérifier que l'utilisateur existe
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, pseudo: true },
      });

      if (!existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: 'Utilisateur non trouvé',
          },
          { status: 404 }
        );
      }

      // Empêcher l'auto-suppression
      if (userId === context.user!.id) {
        return NextResponse.json(
          {
            success: false,
            error: 'Impossible de supprimer votre propre compte',
          },
          { status: 400 }
        );
      }

      // Empêcher la suppression du dernier admin
      if (existingUser.role === 'root') {
        const adminCount = await prisma.user.count({
          where: { role: 'root' },
        });

        if (adminCount <= 1) {
          return NextResponse.json(
            {
              success: false,
              error: 'Impossible de supprimer le dernier administrateur',
            },
            { status: 400 }
          );
        }
      }

      // Supprimer l'utilisateur (les relations seront supprimées en cascade)
      await prisma.user.delete({
        where: { id: userId },
      });

      return NextResponse.json({
        success: true,
        message: `Utilisateur ${existingUser.pseudo} supprimé avec succès`,
      });
    } catch (error) {
      console.error('Admin user deletion error:', error);
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la suppression de l'utilisateur",
        },
        { status: 500 }
      );
    }
  });
}
