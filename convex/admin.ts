// convex/admin.ts

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, query, internalQuery, mutation } from "./_generated/server";
import { FutbolYaRole } from "../lib/role-utils";

interface ConvexUser {
  _id: string;
  clerkId: string;
  email?: string;
  userName: string;
  personaId: string;
  persona?: {
    nombrePersona: string;
    apellidoPersona: string;
    [key: string]: any;
  } | null; // Add null as a possible type
}

interface EnhancedUser extends ConvexUser {
  role: string;
}

/**
 * An action to update a user's role in Clerk's metadata.
 * Actions are used for calling third-party APIs.
 */
export const setUserRole = action({
  args: {
    clerkId: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Authorize: Ensure the user calling this is an admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required.");

    // Use the flattened role structure that's working
    const userRole = identity.futbolYaRole as FutbolYaRole;
    
    console.log("User attempting to assign role:", userRole);
    
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      throw new Error("You do not have permission to assign roles.");
    }

    // 2. Validate the role being assigned
    const validRoles: FutbolYaRole[] = ['admin', 'superadmin', 'entrenador', 'arbitro', 'jugador'];
    if (!validRoles.includes(args.role as FutbolYaRole)) {
      throw new Error(`Invalid role: ${args.role}. Valid roles are: ${validRoles.join(', ')}`);
    }

    // 3. Call the Clerk Admin API to update the user's metadata
    const clerkAPIKey = process.env.CLERK_SECRET_KEY;
    if (!clerkAPIKey) throw new Error("CLERK_SECRET_KEY is not set.");

    const response = await fetch(`https://api.clerk.com/v1/users/${args.clerkId}/metadata`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${clerkAPIKey}`,
      },
      body: JSON.stringify({
        public_metadata: {
          futbolYaRole: args.role,
        }
      }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to update user role in Clerk: ${errorBody}`);
    }

    return await response.json();
  },
});

export const listUsersWithClerkRoles = action({
  args: {},
  handler: async (ctx): Promise<EnhancedUser[]> => {
    // Authorization checks remain the same...
    
    // Fetch users from Clerk
    const clerkAPIKey = process.env.CLERK_SECRET_KEY;
    if (!clerkAPIKey) throw new Error("CLERK_SECRET_KEY is not set.");

    const clerkUsersResponse = await fetch(`https://api.clerk.com/v1/users`, {
        headers: { Authorization: `Bearer ${clerkAPIKey}` },
    });
    if (!clerkUsersResponse.ok) throw new Error("Failed to fetch users from Clerk.");
    const clerkUsers = await clerkUsersResponse.json();
    
    console.log(`Found ${clerkUsers.length} users in Clerk`);

    // Fetch users from Convex
    const convexUsers = await ctx.runQuery(internal.admin.listUsersInternal);
    console.log(`Found ${convexUsers.length} users in Convex`);

    // Map and merge user data
    const result = convexUsers.map((convexUser) => {
        const clerkUser = clerkUsers.find((u: any) => u.id === convexUser.clerkId);
        if (!clerkUser) {
            console.log(`Warning: No Clerk user found for Convex user ${convexUser.clerkId}`);
            // If no Clerk user found, return with explicit Pending role
            return {
                ...convexUser,
                role: "pending"
            };
        }
        
        // Get role from different possible locations
        const publicRole = clerkUser?.public_metadata?.futbolYaRole;
        const unsafeRole = clerkUser?.unsafe_metadata?.futbolYaRole;
        const role = publicRole || unsafeRole || "pending";
        
        console.log(`User ${convexUser.userName} has role: ${role}`);
                     
        return {
            ...convexUser,
            role,
        };
    });
    
    console.log(`Returning ${result.length} merged users`);
    return result;
  }
});


// This is an internal query used by the action above
export const listUsersInternal = internalQuery({
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        return Promise.all(
            users.map(async (user) => {
                const persona = await ctx.db.get(user.personaId);
                return { ...user, persona };
            })
        );
    }
});