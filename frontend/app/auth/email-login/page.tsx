'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { showErrorToast } from '../../../lib/toast-utils';
import { Mail, KeyRound, User } from 'lucide-react';

export default function EmailLoginPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpSection, setShowOtpSection] = useState(false);
  const [error, setError] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  
  const { 
    requestVerificationOTP, 
    verifySignupOTP,
    isLoading
  } = useAuth();
  
  const router = useRouter();

  const handleRequestVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      showErrorToast('Please enter your email address');
      return;
    }

    if (isSignup && !name) {
      setError('Please enter your name');
      showErrorToast('Please enter your name');
      return;
    }

    const success = await requestVerificationOTP(email, isSignup ? name : '');
    if (success) {
      setShowOtpSection(true);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp) {
      setError('Please enter the verification code');
      showErrorToast('Please enter the verification code');
      return;
    }

    const success = await verifySignupOTP(email, otp, isSignup ? name : '');
    if (success) {
      router.push('/dashboard');
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setError('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="px-6 py-5 space-y-2">
          <CardTitle className="text-2xl font-bold">
            {isSignup ? 'Create SnipStash Account' : 'Login to SnipStash'}
          </CardTitle>
          <CardDescription className="text-base">
            {!showOtpSection 
              ? isSignup
                ? 'Enter your details to sign up with email verification'
                : 'Enter your email for passwordless login'
              : 'Enter the verification code sent to your email'}
          </CardDescription>
        </CardHeader>

        <form onSubmit={showOtpSection ? handleVerifyOTP : handleRequestVerification}>
          <CardContent className="px-6 py-4 space-y-6">
            {error && (
              <div className="p-4 rounded-md bg-red-500/10 text-red-500 text-sm font-medium mb-2">
                {error}
              </div>
            )}

            {!showOtpSection ? (
              <>
                {isSignup && (
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-sm font-medium">Your Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                        className="pl-10 h-11"
                        required={isSignup}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3 mt-4">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading || showOtpSection}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-6 py-2">
                <div className="bg-blue-500/10 p-4 rounded-md">
                  <p className="text-sm text-blue-600 font-medium">Verification code sent to <strong>{email}</strong></p>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="otp" className="text-sm font-medium">Enter verification code</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="otp"
                      type="text"
                      placeholder="6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      disabled={isLoading}
                      className="pl-10 text-center tracking-widest text-lg h-12"
                      required
                      maxLength={6}
                    />
                  </div>
                </div>
                
                <div className="text-sm text-center pt-2">
                  Didn't receive the code?{' '}
                  <button 
                    type="button" 
                    onClick={() => requestVerificationOTP(email, isSignup ? name : '')}
                    className="text-primary hover:underline font-medium"
                    disabled={isLoading}
                  >
                    Resend
                  </button>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col px-6 pb-6 pt-2">
            <Button 
              type="submit" 
              className="w-full h-11 text-base"
              disabled={isLoading}
            >
              {isLoading 
                ? 'Please wait...' 
                : showOtpSection
                  ? isSignup ? 'Complete Signup' : 'Login'
                  : 'Continue with Email'
              }
            </Button>
            
            {showOtpSection && (
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setShowOtpSection(false)}
                disabled={isLoading}
                className="mt-4"
              >
                Back
              </Button>
            )}
            
            {!showOtpSection && (
              <div className="flex flex-col space-y-3 w-full mt-5 pt-3 border-t border-border">
                <div className="text-sm text-center">
                  {isSignup 
                    ? 'Already have an account? ' 
                    : 'Don\'t have an account? '
                  }
                  <button 
                    type="button"
                    onClick={toggleMode} 
                    className="text-primary hover:underline font-medium ml-1"
                  >
                    {isSignup ? 'Login' : 'Sign up'}
                  </button>
                </div>
                <div className="text-sm text-center pt-1">
                  <Link href="/login" className="text-muted-foreground hover:underline">
                    Go back to traditional login
                  </Link>
                </div>
              </div>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}