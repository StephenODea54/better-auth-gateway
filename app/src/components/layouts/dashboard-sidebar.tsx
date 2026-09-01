import { Link, useLoaderData, useLocation } from "@tanstack/react-router";
import {
  AppWindowIcon,
  LockKeyholeIcon,
  ScrollTextIcon,
  ShieldCheckIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react";

import type { FileRouteTypes } from "@/routeTree.gen";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar.tsx";
import { UserMenu } from "@/features/auth/components/user-menu.tsx";

interface DashboardNavigationSection {
  items: {
    icon: typeof AppWindowIcon;
    title: string;
    to: FileRouteTypes["to"];
  }[];
  title: string;
}

const dashboardNavigation: DashboardNavigationSection[] = [
  {
    items: [
      { icon: AppWindowIcon, title: "Applications", to: "/dashboard/applications" },
    ],
    title: "Registry",
  },
  {
    items: [
      { icon: ShieldIcon, title: "Roles", to: "/dashboard/roles" },
      { icon: LockKeyholeIcon, title: "Permissions and Resources", to: "/dashboard/permissions" },
    ],
    title: "Access",
  },
  {
    items: [
      { icon: UsersIcon, title: "Members", to: "/dashboard/members" },
    ],
    title: "Directory",
  },
  {
    items: [
      { icon: ScrollTextIcon, title: "Activity", to: "/dashboard/activity" },
    ],
    title: "Audit",
  },
];

export function DashboardSidebar() {
  const { pathname } = useLocation();
  const { session } = useLoaderData({ from: "/dashboard" });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 justify-center border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link to="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <ShieldCheckIcon className="size-4" />
                </div>
                <span className="truncate font-semibold">Auth Gateway</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {dashboardNavigation.map(section => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map(item => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.to}
                      tooltip={item.title}
                    >
                      <Link to={item.to}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu user={session.user} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
