import { users } from '@shared/schema';
import { db } from '../db';
import { eq, or } from 'drizzle-orm';

export interface GoogleProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export interface FacebookProfile {
  id: string;
  email: string;
  name: string;
  picture?: {
    data: {
      url: string;
    };
  };
  first_name?: string;
  last_name?: string;
}

export class SocialAuthService {
  /**
   * Verify Google OAuth token and get user profile
   */
  async verifyGoogleToken(token: string): Promise<GoogleProfile | null> {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${token}`);
      
      if (!response.ok) {
        return null;
      }

      const profile: GoogleProfile = await response.json();
      return profile;
    } catch (error) {
      console.error('Google token verification failed:', error);
      return null;
    }
  }

  /**
   * Verify Facebook OAuth token and get user profile  
   */
  async verifyFacebookToken(token: string): Promise<FacebookProfile | null> {
    try {
      const response = await fetch(`https://graph.facebook.com/me?access_token=${token}&fields=id,name,email,picture,first_name,last_name`);
      
      if (!response.ok) {
        return null;
      }

      const profile: FacebookProfile = await response.json();
      return profile;
    } catch (error) {
      console.error('Facebook token verification failed:', error);
      return null;
    }
  }

  /**
   * Find or create user from Google profile
   */
  async findOrCreateGoogleUser(profile: GoogleProfile) {
    try {
      // Check if user already exists by Google ID or email
      let [existingUser] = await db
        .select()
        .from(users)
        .where(
          or(
            eq(users.googleId, profile.id),
            eq(users.email, profile.email)
          )
        )
        .limit(1);

      if (existingUser) {
        // Update Google ID if not set
        if (!existingUser.googleId) {
          [existingUser] = await db
            .update(users)
            .set({
              googleId: profile.id,
              profileImageUrl: profile.picture,
              emailVerified: true,
              lastLogin: new Date(),
              updatedAt: new Date()
            })
            .where(eq(users.id, existingUser.id))
            .returning();
        } else {
          // Update last login
          [existingUser] = await db
            .update(users)
            .set({
              lastLogin: new Date(),
              updatedAt: new Date()
            })
            .where(eq(users.id, existingUser.id))
            .returning();
        }
        
        return existingUser;
      }

      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          googleId: profile.id,
          email: profile.email,
          fullName: profile.name,
          authMethod: 'google',
          emailVerified: true,
          profileImageUrl: profile.picture,
          role: 'farmer',
          lastLogin: new Date()
        })
        .returning();

      return newUser;
    } catch (error) {
      console.error('Error finding/creating Google user:', error);
      throw error;
    }
  }

  /**
   * Find or create user from Facebook profile
   */
  async findOrCreateFacebookUser(profile: FacebookProfile) {
    try {
      // Check if user already exists by Facebook ID or email
      let [existingUser] = await db
        .select()
        .from(users)
        .where(
          or(
            eq(users.facebookId, profile.id),
            eq(users.email, profile.email)
          )
        )
        .limit(1);

      if (existingUser) {
        // Update Facebook ID if not set
        if (!existingUser.facebookId) {
          [existingUser] = await db
            .update(users)
            .set({
              facebookId: profile.id,
              profileImageUrl: profile.picture?.data?.url,
              emailVerified: true,
              lastLogin: new Date(),
              updatedAt: new Date()
            })
            .where(eq(users.id, existingUser.id))
            .returning();
        } else {
          // Update last login
          [existingUser] = await db
            .update(users)
            .set({
              lastLogin: new Date(),
              updatedAt: new Date()
            })
            .where(eq(users.id, existingUser.id))
            .returning();
        }
        
        return existingUser;
      }

      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          facebookId: profile.id,
          email: profile.email,
          fullName: profile.name,
          authMethod: 'facebook',
          emailVerified: true,
          profileImageUrl: profile.picture?.data?.url,
          role: 'farmer',
          lastLogin: new Date()
        })
        .returning();

      return newUser;
    } catch (error) {
      console.error('Error finding/creating Facebook user:', error);
      throw error;
    }
  }
}

export const socialAuthService = new SocialAuthService();