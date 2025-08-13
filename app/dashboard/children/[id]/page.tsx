"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateChildInterests, getCurrentParent } from "@/lib/actions";
import { calculateAge } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const INTEREST_OPTIONS = [
  "Science", "Math", "Art", "Music", "Sports", "Animals", "Nature", 
  "History", "Geography", "Technology", "Cooking", "Reading", 
  "Languages", "Dancing", "Building", "Space", "Dinosaurs", "Cars"
];

interface Child {
  id: string;
  name: string;
  birthday: Date;
  interests: string[];
}

export default function EditChildPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [child, setChild] = useState<Child | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paramsData, setParamsData] = useState<{ id: string } | null>(null);

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setParamsData(resolvedParams);
    }
    loadParams();
  }, [params]);

  useEffect(() => {
    async function loadChild() {
      if (!paramsData) return;
      
      try {
        const parent = await getCurrentParent();
        if (!parent) return;
        
        const foundChild = parent.children.find(c => c.id === paramsData.id);
        if (foundChild) {
          setChild(foundChild);
          setSelectedInterests(foundChild.interests);
        }
      } catch (error) {
        console.error("Error loading child:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadChild();
  }, [paramsData]);

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!child) return;

    setIsSubmitting(true);
    try {
      await updateChildInterests(child.id, selectedInterests);
      router.push("/dashboard/children");
    } catch (error) {
      console.error("Error updating child:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Child not found</div>
        </div>
      </div>
    );
  }

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
                Edit {child.name}'s Profile
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-sm">{calculateAge(child.birthday)} years old</Badge>
                <Badge variant="outline" className="text-sm">{selectedInterests.length} interests</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-muted/20">
        <div className="max-w-4xl mx-auto p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <Card className="bg-background">
              <CardHeader className="border-b px-6 py-5">
                <CardTitle className="text-2xl font-semibold text-foreground font-serif-elegant">
                  Interests & Preferences
                </CardTitle>
                <p className="text-muted-foreground text-lg mt-1">
                  Select all interests that apply to {child.name}. This helps us curate better recommendations.
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
                        ? `Great! You've selected ${selectedInterests.length} interests.`
                        : `Please select at least 3 interests (${selectedInterests.length}/3 selected).`
                      }
                    </p>
                    <p className="text-xs mt-1 opacity-80">
                      More interests help us provide better video recommendations.
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
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}