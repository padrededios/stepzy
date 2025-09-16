import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/middleware/auth';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// POST /api/admin/users/[id]/reset-password - Réinitialiser le mot de passe d'un utilisateur
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAdmin(request, async (req, context) => {
    try {
      const { id: userId } = await params;
      const body = await req.json();
      const { newPassword, generateTemporary } = body;

      // Vérifier que l'utilisateur existe
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          pseudo: true,
          email: true,
          role: true,
        },
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

      let passwordToSet = newPassword;

      // Générer un mot de passe temporaire si demandé
      if (generateTemporary) {
        passwordToSet = generateTemporaryPassword();
      }

      // Validation du mot de passe
      if (!passwordToSet || passwordToSet.length < 8) {
        return NextResponse.json(
          {
            success: false,
            error: 'Le mot de passe doit contenir au moins 8 caractères',
          },
          { status: 400 }
        );
      }

      // Hasher le nouveau mot de passe
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(passwordToSet, 12);

      // Mettre à jour le mot de passe
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      // Invalider toutes les sessions de cet utilisateur
      await prisma.session.deleteMany({
        where: { userId: userId },
      });

      const responseData: any = {
        userId: existingUser.id,
        pseudo: existingUser.pseudo,
        sessionsInvalidated: true,
      };

      // Inclure le mot de passe temporaire seulement si généré
      if (generateTemporary) {
        responseData.temporaryPassword = passwordToSet;
      }

      const response = {
        success: true,
        message: `Mot de passe de ${existingUser.pseudo} réinitialisé avec succès`,
        data: responseData,
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error('Admin password reset error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Erreur lors de la réinitialisation du mot de passe',
        },
        { status: 500 }
      );
    }
  });
}

/**
 * Génère un mot de passe temporaire sécurisé
 */
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const length = 12;
  let password = '';

  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Assurer au moins une majuscule, une minuscule et un chiffre
  const randomIndex1 = Math.floor(Math.random() * length);
  const randomIndex2 = Math.floor(Math.random() * length);
  const randomIndex3 = Math.floor(Math.random() * length);

  const passwordArray = password.split('');
  passwordArray[randomIndex1] = 'A';
  passwordArray[randomIndex2] = 'a';
  passwordArray[randomIndex3] = '2';

  return passwordArray.join('');
}
