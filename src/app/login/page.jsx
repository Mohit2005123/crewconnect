'use client';
import Image from 'next/image';
import { useState } from 'react';
import { Checkbox } from '@nextui-org/checkbox';
import Link from 'next/link';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const handleLogin=async(e)=>{
    e.preventDefault();
    setError('');
    try{
        await signInWithEmailAndPassword(auth, email, password);
        router.push("/dashboard");
    }catch(error){
        console.log('Error in login', error);
        if(error.code==="auth/invalid-credential"){
            setError("Invalid email or password");
        }
        else{
            setError("Something went wrong please try again");
        }
    }
  }

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (error) {
      console.log('Error in Google login', error);
      setError("Something went wrong with Google login, please try again");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-[#FFFFFF] shadow-lg rounded-lg flex w-4/5 max-w-5xl h-[700px] overflow-hidden">
        {/* Left Section - Features */}
        <div className="w-2/5 bg-gray-50 p-12 flex items-center justify-center">
          <Image
            src="/signup/image.png"
            alt="Illustration"
            width={300}
            height={300}
            className="mb-6"
          />
        </div>

        {/* Right Section - Form */}
        <div className="w-3/5 p-12">
          <div className="mb-2">
            <div className="bg-[#C4C4C4] rounded-full w-12 h-12"></div>
          </div>
          <h1 className="text-4xl mb-4 text-center text-[#333333] font-sans font-semibold">Log in</h1>
          <p className="text-[#333333] opacity-70 mb-6 font-sans text-center">
            Welcome back! Please log in to your account.
          </p>
          <form className="space-y-4" onSubmit={handleLogin}>
            {error && (
              <div className="text-red-500 text-center mb-4">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-[#666666] text-sm font-medium font-sans">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full border border-gray-300 rounded-2xl p-3 text-black font-sans"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-[#666666] text-sm font-medium font-sans">
                Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="w-full border border-gray-300 rounded-2xl p-3 text-black font-sans"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
              />
              <div className="flex items-center mt-2">
                <Checkbox
                  id="showPassword"
                  isSelected={showPassword}
                  onValueChange={setShowPassword}
                  size="lg"
                >
                  <span className="text-sm text-gray-600">Show password</span>
                </Checkbox>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-black text-[#FFFFFF] py-3 rounded-3xl hover:bg-gray-800 transition font-sans"
            >
              Log In
            </button>

            <button
              type="button"
              className="w-full bg-white text-black border border-gray-300 py-3 rounded-3xl hover:bg-gray-100 transition font-sans flex items-center justify-center mt-4"
              onClick={handleGoogleLogin}
            >
              <Image
                src="/signup/google-icon.svg"
                alt="Google icon"
                width={20}
                height={20}
                className="mr-2"
              />
              Continue with Google
            </button>
          </form>
          <p className="mt-4 text-gray-500 text-center">
            Don’t have an account?{' '}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
