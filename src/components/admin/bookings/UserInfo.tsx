
import React from "react";
import { User } from "lucide-react";

interface UserInfoProps {
  userName: string;
}

export const UserInfo: React.FC<UserInfoProps> = ({ userName }) => {
  return (
    <div className="flex items-center gap-2">
      <User className="h-4 w-4 text-gray-400" />
      <span>{userName}</span>
    </div>
  );
};
