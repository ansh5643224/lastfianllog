"use client"; 
import Navbarcomponent from "@/components/navbar/Navbar";
import { useRouter } from 'next-nprogress-bar';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function AuthPage({
}) {

  const router = useRouter();

  return (
    <>
      <Navbarcomponent/>
      <div className="bg-[#1a1a1f] rounded-lg p-4 flex h-screen flex-col items-center justify-center gap-8">
        <h2 className="text-center font-bold text-3xl leading-tight">
          Welcome to the new 1Anime Auth, Choose a way to login or signup!
        </h2>
        <p className="text-center font-bold leading-tight">by using 1Anime, you agree to our <a className="text-blue-500 hover:text-blue-600" href="">Privacy Policy + Terms of Service</a></p>
        <div className="flex flex-row gap-4">
          <button className="bg-[#FF5733] text-black font-medium py-2 px-3 rounded-lg"
            onClick={() => {
                router.push("/");
            }}
          >
            Go back home
          </button>
          <button disabled className="bg-[#BCBBBB] text-black font-medium py-2 px-3 rounded-lg"
            onClick={() => {
                router.push("#");
            }}
          >
            Email (Coming soon)
          </button>
          <button disabled className="bg-[#BCBBBB] text-black font-medium py-2 px-3 rounded-lg"
            onClick={() => {
                router.push("#");
            }}
          >
            Discord (Coming soon)
          </button>
          <button className="bg-white text-black font-medium py-2 px-3 rounded-lg"
           onClick={() => signIn('AniListProvider')}
          >
            AniList
          </button>
        </div>
      </div>
    </>
  );
}
