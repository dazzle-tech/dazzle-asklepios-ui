import { Shield, FileText, BarChart3, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import React from "react";
const Navbar = () => {
  const navItems = [
    { name: "Dashboard", href: "/", icon: BarChart3 },
    { name: "Report Incident", href: "/report", icon: FileText },
    { name: "Incidents", href: "/incidents", icon: Shield },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Shield className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-xl font-semibold text-foreground">
                MedCare Incident Portal
              </h1>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                    }`
                  }
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-muted-foreground">
              Dr. Sarah Johnson
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;