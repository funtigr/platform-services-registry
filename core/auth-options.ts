import jwt from 'jsonwebtoken';
import { Account, AuthOptions, Session, User } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import KeycloakProvider, { KeycloakProfile } from 'next-auth/providers/keycloak';
import { IS_PROD, AUTH_SERVER_URL, AUTH_RELM, AUTH_RESOURCE, AUTH_SECRET } from '@/config';
import prisma from '@/core/prisma';
import { upsertUser } from '@/services/db/user';

export async function generateSession({ session, token }: { session: Session; token?: JWT }) {
  session.isUser = false;
  session.isAdmin = false;
  session.isEditor = false;
  session.isReader = false;
  session.isAnalyzer = false;
  session.isPrivateAdmin = false;
  session.isPrivateAnalyzer = false;
  session.isPrivateEditor = false;
  session.isPrivateReader = false;
  session.isPublicAdmin = false;
  session.isPublicAnalyzer = false;
  session.isPublicEditor = false;
  session.isPublicReader = false;
  session.isApprover = false;
  session.roles = [];
  session.ministries = {
    editor: [],
    reader: [],
  };

  session.user = {
    id: '',
    name: '',
    email: '',
    image: '',
  };

  // Send properties to the client, like an access_token from a provider.
  if (token) {
    session.idToken = token.idToken ?? '';
    session.user.name = token.name ?? '';

    if (token.email) {
      const user = await prisma.user.findFirst({
        where: { email: token.email },
        select: { id: true, email: true, image: true },
      });

      if (user) {
        session.user.id = user.id;
        session.user.email = user.email;
        session.user.image = user.image;

        session.userId = user.id;
        session.userEmail = user.email;
      }
    }

    session.roles = token.roles || [];

    session.roles.push('user');

    session.roles.forEach((role) => {
      if (role === 'user') {
        session.isUser = true;
        return;
      }

      if (role === 'admin') {
        session.isAdmin = true;
        return;
      }

      if (role === 'editor') {
        session.isEditor = true;
        return;
      }

      if (role === 'reader') {
        session.isReader = true;
        return;
      }

      if (role === 'analyzer') {
        session.isAnalyzer = true;
        return;
      }

      if (role === 'private-admin') {
        session.isPrivateAdmin = true;
        return;
      }

      if (role === 'private-analyzer') {
        session.isPrivateAnalyzer = true;
        return;
      }

      if (role === 'private-editor') {
        session.isPrivateEditor = true;
        return;
      }

      if (role === 'private-reader') {
        session.isPrivateReader = true;
        return;
      }

      if (role === 'public-admin') {
        session.isPublicAdmin = true;
        return;
      }

      if (role === 'public-analyzer') {
        session.isPublicAnalyzer = true;
        return;
      }

      if (role === 'public-editor') {
        session.isPublicEditor = true;
        return;
      }

      if (role === 'public-reader') {
        session.isPublicReader = true;
        return;
      }

      if (role === 'approver') {
        session.isApprover = true;
        return;
      }

      const regexPattern = /^ministry-(\w+)-(.+)$/;
      const match = regexPattern.exec(role);
      if (match) {
        const ministryCode = match[1];
        const ministryRole = match[2];
        if (!Array.isArray(session.ministries[ministryRole])) session.ministries[ministryCode] = [];
        session.ministries[ministryRole].push(ministryCode.toUpperCase());
      }
    });
  }

  session.previews = {
    security: !IS_PROD,
    comments: !IS_PROD,
  };

  session.permissions = {
    // Private Products
    createPrivateCloudProducts: session.isAdmin || session.isPrivateAdmin,
    viewAllPrivateCloudProducts:
      session.isAdmin ||
      session.isEditor ||
      session.isReader ||
      session.isPrivateAdmin ||
      session.isPrivateEditor ||
      session.isPrivateReader,

    viewAllPrivateCloudProductsHistory: session.isAdmin || session.isPrivateAdmin,

    editAllPrivateCloudProducts:
      session.isAdmin || session.isEditor || session.isPrivateAdmin || session.isPrivateEditor,
    deleteAllPrivateCloudProducts:
      session.isAdmin || session.isEditor || session.isPrivateAdmin || session.isPrivateEditor,
    reviewAllPrivateCloudRequests: session.isAdmin || session.isPrivateAdmin,

    // Public Products
    createPublicCloudProducts: session.isAdmin || session.isPublicAdmin,
    viewAllPublicCloudProducts:
      session.isAdmin ||
      session.isEditor ||
      session.isReader ||
      session.isPublicAdmin ||
      session.isPublicEditor ||
      session.isPublicReader,

    viewAllPublicCloudProductsHistory: session.isAdmin || session.isPublicAdmin,

    editAllPublicCloudProducts: session.isAdmin || session.isEditor || session.isPublicAdmin || session.isPublicEditor,
    deleteAllPublicCloudProducts:
      session.isAdmin || session.isEditor || session.isPublicAdmin || session.isPublicEditor,
    reviewAllPublicCloudRequests: session.isAdmin || session.isPublicAdmin,

    createPrivateProductComments: session.isAdmin,
    viewAllPrivateProductComments: session.isAdmin || session.isReader,
    editAllPrivateProductComments: session.isAdmin,
    deleteAllPrivateProductComments: session.isAdmin,

    createPublicProductComments: session.isAdmin,
    viewAllPublicProductComments: session.isAdmin || session.isReader,
    editAllPublicProductComments: session.isAdmin,
    deleteAllPublicProductComments: session.isAdmin,

    viewZapscanResults: session.isAdmin || session.isAnalyzer,
    viewSonarscanResults: session.isAdmin || session.isAnalyzer,
    viewPublicAnalytics: session.isAdmin || session.isAnalyzer || session.isPublicAnalyzer,
    viewPrivateAnalytics: session.isAdmin || session.isAnalyzer || session.isPrivateAnalyzer,
  };

  return session;
}

export const authOptions: AuthOptions = {
  providers: [
    // See https://github.com/nextauthjs/next-auth/blob/93e108763f434a4fd33c74ed79d17d7368dfd27b/packages/next-auth/src/providers/keycloak.ts#L27
    KeycloakProvider({
      clientId: AUTH_RESOURCE!,
      clientSecret: AUTH_SECRET!,
      issuer: `${AUTH_SERVER_URL}/realms/${AUTH_RELM}`,
    }),
  ],
  session: {
    strategy: 'jwt',
    /**
     * Relative time from now in seconds when to expire the session
     * @default 2592000 // 30 days
     */
    maxAge: 86400, // 1 day
    /**
     * How often the session should be updated in seconds.
     * If set to `0`, session is updated every time.
     * @default 86400 // 1 day
     */
    updateAge: 3600, // 1 hour
  },
  secret: AUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      const { given_name, family_name, email } = profile as KeycloakProfile;
      const loweremail = email.toLowerCase();

      const upsertedUser = await upsertUser(loweremail);
      if (!upsertedUser) {
        const data = {
          firstName: given_name,
          lastName: family_name,
          email: loweremail,
          ministry: '',
          idir: '',
          upn: '',
          image: '',
        };

        await prisma.user.upsert({
          where: { email: loweremail },
          update: data,
          create: data,
        });
      }

      return true;
    },
    async jwt({ token, account }: { token: JWT; account: Account | null }) {
      if (account?.access_token) {
        const decodedToken: any = jwt.decode(account.access_token);

        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.roles = decodedToken?.resource_access?.pltsvc?.roles ?? [];
      }

      if (!token.roles) token.roles = [];
      return token;
    },
    session: generateSession.bind(this),
  },
};
