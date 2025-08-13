"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createChild } from "@/lib/actions";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const INTEREST_OPTIONS = [
  "Science", "Math", "Art", "Music", "Sports", "Animals", "Nature", 
  "History", "Geography", "Technology", "Cooking", "Reading", 
  "Languages", "Dancing", "Building", "Space", "Dinosaurs", "Cars"
];

export default function NewChildPage() {
  const router = useRouter();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      // Add selected interests to form data
      selectedInterests.forEach(interest => {
        formData.append("interests", interest);
      });
      
      await createChild(formData);
      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating child:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b bg-background">
        <div className="flex h-20 items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/children">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Children
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground font-serif-elegant">
                Add New Child
              </h1>
              <p className="text-muted-foreground mt-1">
                Create a profile to get personalized video recommendations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-muted/20">
        <div className="max-w-4xl mx-auto p-8">
          <form action={handleSubmit} className="space-y-8">
            <Card className="bg-background">
              <CardHeader className="border-b px-6 py-5">
                <CardTitle className="text-2xl font-semibold text-foreground font-serif-elegant">
                  Basic Information
                </CardTitle>
                <p className="text-muted-foreground text-lg mt-1">
                  Tell us about your child to personalize their experience.
                </p>
              </CardHeader>

              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-base font-medium">Child's Name</Label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      required
                      placeholder="Enter child's name"
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthday" className="text-base font-medium">Birthday</Label>
                    <Input
                      type="date"
                      id="birthday"
                      name="birthday"
                      required
                      className="h-12 text-base"
                      max={new Date().toISOString().split('T')[0]}
                      min={new Date(new Date().getFullYear() - 18, 0, 1).toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardHeader className="border-b px-6 py-5">
                <CardTitle className="text-2xl font-semibold text-foreground font-serif-elegant">
                  Interests & Hobbies
                </CardTitle>
                <p className="text-muted-foreground text-lg mt-1">
                  Select all interests that apply to help us curate the perfect videos.
                </p>
              </CardHeader>

              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {INTEREST_OPTIONS.map((interest) => {
                      const isSelected = selectedInterests.includes(interest);
                      return (
                        <div
                          key={interest}
                          className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border hover:border-primary/50 bg-background"
                          }`}
                          onClick={() => handleInterestToggle(interest)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2 pointer-events-none"
                          />
                          <span className={`text-sm font-medium ${
                            isSelected ? "text-foreground" : "text-muted-foreground"
                          }`}>
                            {interest}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className={`p-4 rounded-lg border-l-4 ${
                    selectedInterests.length >= 3 
                      ? "bg-green-50 border-green-500 text-green-800" 
                      : "bg-yellow-50 border-yellow-500 text-yellow-800"
                  }`}>
                    <p className="text-sm font-medium">
                      {selectedInterests.length >= 3 
                        ? `Perfect! You've selected ${selectedInterests.length} interests.`
                        : `Please select at least 3 interests (${selectedInterests.length}/3 selected).`
                      }
                    </p>
                    <p className="text-xs mt-1 opacity-80">
                      The more interests you select, the better our recommendations will be.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-4">
              <Button variant="outline" size="lg" asChild>
                <Link href="/dashboard/children">
                  Cancel
                </Link>
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || selectedInterests.length < 3}
                size="lg"
                className="px-8"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isSubmitting ? "Creating..." : "Create Profile"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}