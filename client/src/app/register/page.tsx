"use client"
 
 import { useState } from "react"
 import { useRouter } from "next/navigation"
 import { Button } from "@/components/ui/button"
 import { Input } from "@/components/ui/input"
 import { Label } from "@/components/ui/label"
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
 import { toast } from "sonner"
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
 import Link from "next/link"
 
 export default function Register() {
     const [name, setName] = useState("")
     const [email, setEmail] = useState("")
     const [password, setPassword] = useState("")
     const [role, setRole] = useState("")
     const router = useRouter()
 
     const handleSubmit = async (e: React.FormEvent) => {
         e.preventDefault()
         try {
             const response = await fetch("/api/auth/register", {
                 method: "POST",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({ name, email, password, role }),
             })
             const data = await response.json()
             if (response.ok) {
                 toast.success("Registration successful. Please login.");
                 router.push("/login")
             } else {
                 toast.error(data.message);
             }
         } catch (error) {
             toast.error("An error occurred. Please try again.");
             console.error("Error Occurred: ", error);
         }
     }
 
     return (
         <div className="flex items-center justify-center min-h-screen bg-[#0A0A09] py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#E2A93E] selection:text-black">
             <Card className="w-full max-w-md bg-[#0F0F0E] border-[#1F1F1D] text-[#F5F5F4] shadow-sm rounded-lg">
                 <CardHeader className="border-b border-[#1F1F1D] pb-6 text-center">
                     <div className="inline-flex h-10 w-10 border border-[#C5A880]/40 bg-[#121211] rounded items-center justify-center mb-4 mx-auto">
                         <span className="text-[#C5A880] font-serif font-bold text-lg">D</span>
                     </div>
                     <CardTitle className="text-xl font-serif font-medium text-white">Create Account</CardTitle>
                     <CardDescription className="text-[#8E8E87] mt-1">Join the decentralized workspace network</CardDescription>
                 </CardHeader>
                 <CardContent className="pt-6">
                     <form onSubmit={handleSubmit} className="space-y-4">
                         <div className="space-y-2">
                             <Label htmlFor="name" className="text-[#A3A39C] text-xs font-mono uppercase tracking-wider">Name</Label>
                             <Input
                                 id="name"
                                 type="text"
                                 placeholder="Enter your name"
                                 value={name}
                                 onChange={(e) => setName(e.target.value)}
                                 required
                                 className="block w-full bg-[#121211] border-[#1F1F1D] text-[#F5F5F4] focus-visible:ring-1 focus-visible:ring-[#C5A880] focus-visible:border-[#C5A880]"
                             />
                         </div>
                         <div className="space-y-2">
                             <Label htmlFor="email" className="text-[#A3A39C] text-xs font-mono uppercase tracking-wider">Email</Label>
                             <Input
                                 id="email"
                                 type="email"
                                 placeholder="Enter your email"
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
                                 placeholder="Enter your password"
                                 value={password}
                                 onChange={(e) => setPassword(e.target.value)}
                                 required
                                 className="block w-full bg-[#121211] border-[#1F1F1D] text-[#F5F5F4] focus-visible:ring-1 focus-visible:ring-[#C5A880] focus-visible:border-[#C5A880]"
                             />
                         </div>
                         <div className="space-y-2">
                             <Label htmlFor="role" className="text-[#A3A39C] text-xs font-mono uppercase tracking-wider">Role</Label>
                             <Select onValueChange={setRole} required>
                                 <SelectTrigger className="w-full bg-[#121211] border-[#1F1F1D] text-[#F5F5F4] focus:ring-[#C5A880] focus:border-[#C5A880]">
                                     <SelectValue placeholder="Select your role" />
                                 </SelectTrigger>
                                 <SelectContent className="bg-[#0F0F0E] border-[#1F1F1D] text-[#F5F5F4]">
                                     <SelectItem value="Company" className="hover:bg-[#121211] focus:bg-[#121211] focus:text-[#C5A880] cursor-pointer">Company</SelectItem>
                                     <SelectItem value="Freelancer" className="hover:bg-[#121211] focus:bg-[#121211] focus:text-[#C5A880] cursor-pointer">Freelancer</SelectItem>
                                 </SelectContent>
                             </Select>
                         </div>
                         <Button type="submit" className="w-full bg-[#C5A880] text-black font-medium hover:bg-[#E2A93E] hover:text-black transition-colors mt-6">
                             Register
                         </Button>
                     </form>
 
                     <div className="mt-6 pt-4 border-t border-[#1F1F1D] text-center">
                         <span className="text-xs text-[#8E8E87]">
                             Already have an account?{" "}
                             <Link href="/login" className="text-[#C5A880] hover:text-[#E2A93E] underline font-medium">
                                 Log in
                             </Link>
                         </span>
                     </div>
                 </CardContent>
             </Card>
         </div>
     )
 }
