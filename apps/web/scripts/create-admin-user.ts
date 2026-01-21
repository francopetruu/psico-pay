import { hash } from "bcrypt";
import { createDb, users } from "@psico-pay/db";
import { closePool } from "@psico-pay/db";

async function createAdminUser() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || "Admin";

  if (!email || !password) {
    console.error("Usage: npx tsx scripts/create-admin-user.ts <email> <password> [name]");
    console.error("Example: npx tsx scripts/create-admin-user.ts admin@psicopay.com mypassword123 'Admin User'");
    process.exit(1);
  }

  if (password.length < 6) {
    console.error("Error: Password must be at least 6 characters long");
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Error: DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const db = createDb(connectionString);

  try {
    // Hash the password
    const passwordHash = await hash(password, 12);

    // Insert the user
    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        name,
        role: "admin",
        isActive: true,
      })
      .returning({ id: users.id, email: users.email, name: users.name, role: users.role });

    console.log("Admin user created successfully!");
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Role: ${user.role}`);
  } catch (error) {
    if ((error as Error).message.includes("duplicate key")) {
      console.error(`Error: A user with email "${email}" already exists`);
    } else {
      console.error("Error creating user:", error);
    }
    process.exit(1);
  } finally {
    await closePool();
  }
}

createAdminUser();
