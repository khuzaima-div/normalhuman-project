import { db } from "@/server/db";

export const POST = async (req: Request) => {
  const { data } = await req.json();
  console.log("🚀 Clerk webhook received data:", data);

  const id = data.id;
  const first_name = data.first_name;
  const last_name = data.last_name;
  const image_url = data.image_url;
  const emailAddress = data.email_addresses?.[0]?.email_address;

  // Video ke mutabiq exact database insertion
  await db.user.create({
    data: {
      clerkId: id,
      emailAddress: emailAddress,
      firstName: first_name,
      lastName: last_name,
      imageUrl: image_url,
    }
  })

  console.log('user created')
  return new Response('Webhook received', { status: 200 })
};