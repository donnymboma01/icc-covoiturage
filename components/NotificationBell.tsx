import { IoNotifications } from "react-icons/io5";
import { MdEventSeat } from "react-icons/md";

interface NotificationBellProps {
  count: number;
  hasNew: boolean;
  type?: "booking" | "reservation";
  status?: "accepted" | "rejected" | "cancelled";
}

const NotificationBell = ({
  count,
  hasNew,
  type = "booking",
  status,
}: NotificationBellProps) => {
  if (type === "reservation" && !hasNew) {
    return <MdEventSeat className="h-6 w-6" />;
  }

  return (
    <div className="relative inline-block">
      {type === "booking" ? (
        <IoNotifications className="h-6 w-6 text-gray-600" />
      ) : (
        <IoNotifications className="h-6 w-6 text-blue-600 animate-bounce" />
      )}
      {count > 0 && (
        <span
          className={`absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full 
          ${
            status === "accepted"
              ? "bg-green-500"
              : status === "rejected"
              ? "bg-red-500"
              : status === "cancelled"
              ? "bg-orange-500"
              : hasNew
              ? "bg-red-500"
              : "bg-gray-500"
          } 
          text-white animate-pulse`}
        >
          {count}
        </span>
      )}
    </div>
  );
};

export default NotificationBell;
