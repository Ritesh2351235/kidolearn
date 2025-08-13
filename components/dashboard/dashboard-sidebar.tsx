"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  Home,
  Users,
  ThumbsUp,
  VideoIcon,
  BarChart3,
  Settings,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigation = [
  { 
    name: "Dashboard", 
    href: "/dashboard", 
    icon: Home,
  },
  { 
    name: "Children", 
    href: "/dashboard/children", 
    icon: Users,
  },
  { 
    name: "Recommendations", 
    href: "/dashboard/recommendations", 
    icon: VideoIcon,
  },
  { 
    name: "Approved Videos", 
    href: "/dashboard/approved", 
    icon: ThumbsUp,
  },
  { 
    name: "Analytics", 
    href: "/dashboard/analytics", 
    icon: BarChart3,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile sidebar trigger */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <SidebarTrigger className="bg-background border shadow-md" />
      </div>

      <Sidebar className="border-r">
        {/* Header */}
        <SidebarHeader className="border-b px-6 py-4">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-foreground font-serif-elegant">
              kido
            </span>
          </Link>
          <p className="text-sm text-muted-foreground mt-1">
            Parent Dashboard
          </p>
        </SidebarHeader>

        {/* Navigation Content */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Navigation
            </SidebarGroupLabel>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild
                      isActive={isActive}
                      size="lg"
                      className="px-3 py-2 w-full justify-start"
                    >
                      <Link href={item.href}>
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Settings
            </SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild size="lg" className="px-3 py-2 w-full justify-start">
                  <Link href="/dashboard/settings">
                    <Settings className="h-4 w-4" />
                    <span className="font-medium">Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="border-t px-4 py-4">
          <div className="flex items-center gap-3">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                  userButtonPopoverCard: "shadow-lg border",
                },
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Account</p>
              <p className="text-xs text-muted-foreground truncate">Manage profile</p>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}