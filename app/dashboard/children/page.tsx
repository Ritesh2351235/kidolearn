import { getCurrentParent } from "@/lib/actions";
import { calculateAge } from "@/lib/utils";
import Link from "next/link";
import { Plus, Users, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default async function ChildrenPage() {
  const parent = await getCurrentParent();
  
  if (!parent) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
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
            <div>
              <h1 className="text-3xl font-bold text-foreground font-serif-elegant">
                Your Children
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your children's profiles and interests for personalized recommendations.
              </p>
            </div>
          </div>
          <Button asChild size="lg">
            <Link href="/dashboard/children/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Child
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-muted/20">
        <div className="p-8">
          {parent.children.length === 0 ? (
            <Card className="bg-background">
              <CardContent className="p-16 text-center">
                <Users className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-foreground mb-3 font-serif-elegant">
                  No children added yet
                </h3>
                <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-lg leading-relaxed">
                  Start by adding your first child profile. This helps us curate age-appropriate 
                  and interest-based video recommendations.
                </p>
                <Button asChild size="lg" className="px-8">
                  <Link href="/dashboard/children/new">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Your First Child
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {parent.children.map((child) => (
                <Card key={child.id} className="hover:border-primary transition-all duration-200 hover:shadow-md bg-background">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-semibold text-foreground">
                          {child.name}
                        </CardTitle>
                        <CardDescription className="text-base mt-1">
                          {calculateAge(child.birthday)} years old
                        </CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/children/${child.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="mb-6">
                      <p className="text-sm font-medium text-muted-foreground mb-3">Interests:</p>
                      <div className="flex flex-wrap gap-2">
                        {child.interests.length > 0 ? (
                          child.interests.map((interest) => (
                            <Badge
                              key={interest}
                              variant="secondary"
                              className="text-sm px-3 py-1"
                            >
                              {interest}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">No interests added yet</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <Button variant="outline" asChild className="w-full">
                        <Link href={`/dashboard/children/${child.id}`}>
                          Edit Profile →
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}