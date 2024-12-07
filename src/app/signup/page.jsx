'use client';
import Image from 'next/image';
import { useState } from 'react';
import {Checkbox} from "@nextui-org/checkbox";
import Link from 'next/link';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import {auth, db} from '../../lib/firebase';
import {setDoc, doc, getDoc} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
export default function SignUp() {
  // Add state for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const handleSignup=async(e)=>{
    e.preventDefault();
    setError('');
    try{
       const userCredential=await createUserWithEmailAndPassword(auth, email, password);
       const user=userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        uid:user.uid,
        email:user.email,
        name:fullName,
        admin:isAdmin,
        role:isAdmin?"admin":"employee",
      });
      router.push("/dashboard");
    } catch (error) {
        console.log('Error in signup', error);
        if(error.code==="auth/email-already-in-use"){
          setError("Email already in use");
        }else{
          setError("Something went wrong please try again");
        }
    }
  }
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDoc = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userDoc);

      if (userSnapshot.exists()) {
        // User already exists, prompt them to log in
        setError("User already exists. Please log in instead.");
        return;
      }

      // If user does not exist, proceed with signup
      console.log("Prompting for admin status...");
      const adminResponse = window.confirm("Are you signing up as an admin?");
      const isAdmin = adminResponse;

      await setDoc(userDoc, {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        admin: isAdmin,
        role: isAdmin ? "admin" : "employee",
      });
      console.log("User document created with admin status:", isAdmin);

      router.push("/dashboard");
    } catch (error) {
      console.log('Error in Google sign-in', error);
      setError("Failed to sign in with Google. Please try again.");
    }
  };
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    <div className="bg-[#FFFFFF] shadow-lg rounded-lg flex w-4/5 max-w-5xl h-[700px] overflow-hidden">
        {/* Left Section - Form */}
        <div className="w-3/5 p-12">
          <div className="mb-2">
            <div className="bg-[#C4C4C4] rounded-full w-12 h-12"></div>
          </div>
          <h1 className="text-4xl mb-4 text-center text-[#333333] font-sans font-semibold">Sign up</h1>
          <p className="text-[#333333] opacity-70 mb-6 font-sans">
            By signing up, you agree to the{' '}
            <a href="#" className="underline">
              Terms of use
            </a>{' '}
            and{' '}
            <a href="#" className="underline">
              Privacy Policy
            </a>
            .
          </p>
          <form className="space-y-4" onSubmit={handleSignup}>
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-[#666666] text-sm font-medium font-sans">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                className="w-full border border-gray-300 rounded-2xl p-3 text-black font-sans"
                value={fullName}
                onChange={(e)=>setFullName(e.target.value)}
              />
            </div>
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
            
            {/* Add password field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-[#666666] text-sm font-medium font-sans">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="w-full border border-gray-300 rounded-2xl p-3 text-black font-sans"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
              />
              <div className="flex items-center">
                <Checkbox
                  id="showPassword"
                  isSelected={showPassword}
                  onValueChange={setShowPassword}
                  size="lg"
                  className="mr-4"
                >
                  <span className="text-sm text-gray-600">Show password</span>
                </Checkbox>
                <Checkbox
                  id="adminCheckbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  size="lg"
                >
                  <span className="text-sm text-gray-600">Sign up as admin</span>
                </Checkbox>
              </div>       
            </div>

            <button
              type="submit"
              className="w-full bg-black text-[#FFFFFF] py-3 rounded-3xl hover:bg-gray-800 transition font-sans"
              onClick={handleSignup}
            >
              Sign Up
            </button>

            <button
              type="button"
              className="w-full bg-white text-black border border-gray-300 py-3 rounded-3xl hover:bg-gray-100 transition font-sans flex items-center justify-center mt-4"
              onClick={handleGoogleSignIn}
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
            {error && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-center">
                {error}
              </div>
            )}
          </form>
          <p className="mt-4 text-gray-500 text-center">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </p>
        </div>

        {/* Right Section - Features */}
        <div className="w-2/5 bg-gray-50 p-12 flex items-center justify-center">
          <Image
            src="/signup/image.png"
            alt="Illustration"
            width={300}
            height={300}
            className="mb-6"
          />
        </div>
      </div>
    </div>
  );
}