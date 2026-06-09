import { db } from "@/server/db";
export const dynamic = 'force-dynamic';

export const POST = async (req: Request) => {
  const { data } = await req.json();
  console.log("🚀 Clerk webhook received data:", data);

  const id = data.id;
  const first_name = data.first_name;
  const last_name = data.last_name;
  const image_url = data.image_url;
  
  // 🌟 Safe Check: Agar Clerk testing dummy data bhej raha hai jisme email nahi hai, to fake email generate kar lo
  const emailAddress = data.email_addresses?.[0]?.email_address ?? `${id}@temporary.com`;

  try {
    // Exact database insertion with safety fallbacks
    await db.user.create({
      data: {
        id: id,
        emailAddress: emailAddress,
        firstName: first_name ?? "",
        lastName: last_name ?? "",
        imageUrl: image_url ?? "",
      }
    });

    console.log('🎉 User successfully created in Neon DB');
    return new Response('Webhook received', { status: 200 });

  } catch (error) {
    console.error('❌ Prisma Insertion Error:', error);
    return new Response('Database insertion failed', { status: 500 });
  }
};