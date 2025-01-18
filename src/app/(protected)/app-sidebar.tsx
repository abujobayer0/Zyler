"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import useProject from "@/hooks/use-project";
import { cn } from "@/lib/utils";
import {
  Bot,
  CreditCard,
  LayoutDashboard,
  Loader,
  PlusIcon,
  Presentation,
} from "lucide-react";

const items = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Q&A", href: "/qa", icon: Bot },
  { label: "Meetings", href: "/meetings", icon: Presentation },
  { label: "Billing", href: "/billing", icon: CreditCard },
];

const AppSidebar = () => {
  const pathname = usePathname();
  const { open } = useSidebar();
  const { projects, projectId, setProjectId } = useProject();

  const navigate = useRouter();
  return (
    <Sidebar side="left" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center">
          <Image src={"/logo.png"} alt="logo" width={40} height={40} />
          {open && <h1 className="text-xl font-bold text-primary/80">Zyler</h1>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(({ label, href, icon: Icon }) => {
                return (
                  <SidebarMenuItem key={label}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={href}
                        className={cn(
                          {
                            "!bg-primary !text-white": pathname === href,
                          },
                          "list-none",
                        )}
                      >
                        <Icon />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Your Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {projects?.map(({ name, id }) => {
                return (
                  <SidebarMenuItem key={id}>
                    <SidebarMenuButton asChild>
                      <div
                        onClick={() => {
                          setProjectId(id);
                          const location = pathname.startsWith("/dashboard");
                          if (!location) {
                            navigate.push("/dashboard");
                          }
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <div
                          className={cn(
                            "flex size-6 items-center justify-center rounded-sm border bg-white text-sm text-primary",
                            { "bg-primary text-white": id === projectId },
                          )}
                        >
                          {name[0]}
                        </div>
                        <span>{name}</span>
                        {true && <Loader className="animate-spin" />}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/create">
                    <PlusIcon className="h-4 w-4" />
                    <span>New Project</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
