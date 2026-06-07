"use client"
 
 import type React from "react"
 
 import { useState } from "react"
 import { useRouter } from "next/navigation"
 import { Button } from "@/components/ui/button"
 import { Input } from "@/components/ui/input"
 import { Label } from "@/components/ui/label"
 import { toast } from "sonner"
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
 import Link from "next/link"
 
 export default function Login() {
     const [email, setEmail] = useState("")
     const [password, setPassword] = useState("")
     const [isLoading, setIsLoading] = useState(false)
     const router = useRouter()
 
     const handleSubmit = async (e: React.FormEvent) => {
         e.preventDefault();
         setIsLoading(true);
         try {
             const response = await fetch("/api/auth/login", {
                 method: "POST",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({ email, password }),
             });
             const data = await response.json();
 
             if (response.ok) {
                 localStorage.setItem("token", data.token);
                 localStorage.setItem("user", JSON.stringify(data.user));
                 toast.success("Successfully logged in!");
                 router.push("/dashboard");
             } else {
                 toast.error(data.message);
             }
         } catch (error) {
             toast.error("An error occurred. Please try again.");
             console.error(error);
         } finally {
             setIsLoading(false);
         }
     };
 
     return (
         <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A09] py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#E2A93E] selection:text-black">
             <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
                 <div className="inline-flex h-10 w-10 border border-[#C5A880]/40 bg-[#121211] rounded items-center justify-center mb-4">
                     <span className="text-[#C5A880] font-serif font-bold text-lg">D</span>
                 </div>
                 <h1 className="text-3xl font-serif text-white font-medium tracking-tight">DeWorkHub</h1>
                 <p className="mt-2 text-sm text-[#8E8E87]">Decentralised Escrow and Reputation Ledger</p>
             </div>
 
             <Card className="sm:mx-auto sm:w-full sm:max-w-md bg-[#0F0F0E] border-[#1F1F1D] text-[#F5F5F4] shadow-sm rounded-lg">
                 <CardHeader className="border-b border-[#1F1F1D] pb-6">
                     <CardTitle className="text-center text-lg font-serif font-medium text-white">Welcome Back</CardTitle>
                     <CardDescription className="text-center text-[#8E8E87] mt-1">Enter your credentials to access the workspace</CardDescription>
                 </CardHeader>
                 <CardContent className="pt-6">
                     <form onSubmit={handleSubmit} className="space-y-5">
                         <div className="space-y-2">
                             <Label htmlFor="email" className="text-[#A3A39C] text-xs font-mono uppercase tracking-wider">Email address</Label>
                             <Input
                                 id="email"
                                 type="email"
                                 placeholder="name@example.com"
                                 value={email}
                                 onChange={(e) => setEmail(e.target.value)}
                                 required
                                 className="block w-full bg-[#121211] border-[#1F1F1D] text-[#F5F5F4] focus-visible:ring-1 focus-visible:ring-[#C5A880] focus-visible:border-[#C5A880]"
                             />
                         </div>
                         <div className="space-y-2">
                             <Label htmlFor="password" className="text-[#A3A39C] text-xs font-mono uppercase tracking-wider">Password</Label>
                             <Input
                                 id="password"
                                 type="password"
                                 placeholder="••••••••"
                                 value={password}
                                 onChange={(e) => setPassword(e.target.value)}
                                 required
                                 className="block w-full bg-[#121211] border-[#1F1F1D] text-[#F5F5F4] focus-visible:ring-1 focus-visible:ring-[#C5A880] focus-visible:border-[#C5A880]"
                             />
                         </div>
                         <Button 
                             type="submit" 
                             className="w-full bg-[#C5A880] text-black font-medium hover:bg-[#E2A93E] hover:text-black transition-colors" 
                             disabled={isLoading}
                         >
                             {isLoading ? "Signing in..." : "Sign in"}
                         </Button>
                     </form>
 
                     <div className="mt-8 pt-6 border-t border-[#1F1F1D]">
                         <div className="text-center text-xs text-[#8E8E87]">
                             Don&apos;t have an account?{" "}
                             <Link href="/register" className="text-[#C5A880] hover:text-[#E2A93E] underline font-medium">
                                 Sign up for DeWorkHub
                             </Link>
                         </div>
                     </div>
                 </CardContent>
             </Card>
         </div>
     )
 }
