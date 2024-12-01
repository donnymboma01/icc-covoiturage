import React from "react";

const NotificationBadge: React.FC<{ count: number }> = ({ count }) =>
  count > 0 && (
    <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
      {count}
    </span>
  );
export default NotificationBadge;
