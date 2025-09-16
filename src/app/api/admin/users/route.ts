import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/middleware/auth';

const prisma = new PrismaClient();

// GET /api/admin/users - Liste tous les utilisateurs
export async function GET(request: NextRequest) {
  return requireAdmin(request, async (req, context) => {
    try {
      // Paramètres de pagination et filtrage
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = Math.min(
        parseInt(url.searchParams.get('limit') || '20'),
        100
      );
      const search = url.searchParams.get('search') || '';
      const role = url.searchParams.get('role');

      const skip = (page - 1) * limit;

      // Construire le filtre de recherche
      const where: any = {};

      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { pseudo: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (role && (role === 'user' || role === 'root')) {
        where.role = role;
      }

      // Récupérer les utilisateurs avec pagination
      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where,
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
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return NextResponse.json({
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      console.error('Admin users list error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Erreur lors de la récupération des utilisateurs',
        },
        { status: 500 }
      );
    }
  });
}

// POST /api/admin/users - Créer un nouvel utilisateur (admin uniquement)
export async function POST(request: NextRequest) {
  return requireAdmin(request, async (req, context) => {
    try {
      const body = await req.json();
      const { email, password, pseudo, avatar, role } = body;

      // Validation des données
      if (!email || !password || !pseudo) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email, mot de passe et pseudo sont requis',
          },
          { status: 400 }
        );
      }

      if (role && !['user', 'root'].includes(role)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Rôle invalide',
          },
          { status: 400 }
        );
      }

      // Vérifier que l'email n'existe pas
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: 'Un utilisateur avec cet email existe déjà',
          },
          { status: 409 }
        );
      }

      // Hasher le mot de passe
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 12);

      // Créer l'utilisateur
      const newUser = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          pseudo,
          avatar,
          role: role || 'user',
        },
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

      return NextResponse.json(
        {
          success: true,
          message: 'Utilisateur créé avec succès',
          data: { user: newUser },
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Admin user creation error:', error);
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la création de l'utilisateur",
        },
        { status: 500 }
      );
    }
  });
}
