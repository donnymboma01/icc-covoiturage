"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { getUserConversations, markAllConversationsAsViewed } from "@/utils/messaging-service";
import { Conversation } from "@/types/messaging";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ChatWindow from "@/components/messaging/ChatWindow";
import { MessageCircle, MapPin, Calendar, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { 
  getFirestore, 
  doc, 
  getDoc 
} from "firebase/firestore";

interface UserDetails {
  [key: string]: {
    fullName: string;
    profilePicture?: string;
  };
}

interface RideDetails {
  [key: string]: {
    departureAddress: string;
    arrivalAddress: string;
    departureTime: any;
  };
}

const MessagesPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState<UserDetails>({});
  const [rideDetails, setRideDetails] = useState<RideDetails>({});
  const [selectedConversation, setSelectedConversation] = useState<{
    otherUserId: string;
    otherUserName: string;
    otherUserAvatar?: string;
    rideId: string;
    rideInfo?: {
      departure: string;
      arrival: string;
      date: string;
    };
  } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    markAllConversationsAsViewed(user.uid);

    const unsubscribe = getUserConversations(user.uid, async (convs) => {
      setConversations(convs);
      await loadConversationDetails(convs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const loadConversationDetails = async (conversations: Conversation[]) => {
    const db = getFirestore();
    const userDetailsTemp: UserDetails = {};
    const rideDetailsTemp: RideDetails = {};

    for (const conversation of conversations) {
      // Pour chaque participant, charger ses détails
      for (const participantId of conversation.participants) {
        if (participantId && !userDetailsTemp[participantId]) {
          try {
            const userDoc = await getDoc(doc(db, "users", participantId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              userDetailsTemp[participantId] = {
                fullName: userData.fullName || userData.firstName + " " + userData.lastName || "Utilisateur",
                profilePicture: userData.profilePicture
              };
            }
          } catch (error) {
            console.error("Erreur chargement utilisateur:", error);
          }
        }
      }

      if (!rideDetailsTemp[conversation.rideId]) {
        try {
          const rideDoc = await getDoc(doc(db, "rides", conversation.rideId));
          if (rideDoc.exists()) {
            const rideData = rideDoc.data();
            rideDetailsTemp[conversation.rideId] = {
              departureAddress: rideData.departureAddress || "Départ inconnu",
              arrivalAddress: rideData.arrivalAddress || "Arrivée inconnue",
              departureTime: rideData.departureTime
            };
          }
        } catch (error) {
          console.error("Erreur chargement trajet:", error);
        }
      }
    }

    setUserDetails(userDetailsTemp);
    setRideDetails(rideDetailsTemp);
  };

  const handleOpenConversation = (conversation: Conversation) => {
    const otherUserId = conversation.participants.find(id => id !== user?.uid) || user?.uid;
    if (!otherUserId) return;

    const otherUser = userDetails[otherUserId];
    const ride = rideDetails[conversation.rideId];

    setSelectedConversation({
      otherUserId,
      otherUserName: otherUser?.fullName || "Utilisateur",
      otherUserAvatar: otherUser?.profilePicture,
      rideId: conversation.rideId,
      rideInfo: ride ? {
        departure: ride.departureAddress,
        arrival: ride.arrivalAddress,
        date: ride.departureTime?.toDate?.()?.toLocaleDateString("fr-FR") || "Date inconnue"
      } : undefined
    });
    setIsChatOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <div className="text-gray-500">Chargement...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 max-w-4xl">
   
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Retour</span>
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 rounded-full p-3">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mes messages</h1>
              <p className="text-gray-600">
                {conversations.length} conversation{conversations.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {conversations.length === 0 ? (
          <Card className="p-8 text-center bg-white">
            <div className="flex flex-col items-center space-y-6">
              <div className="bg-gray-100 rounded-full p-6">
                <MessageCircle className="h-12 w-12 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">Aucune conversation</h3>
                <p className="text-gray-500 max-w-md">
                  Vos conversations apparaîtront ici une fois que vous aurez commencé à échanger 
                  avec d'autres utilisateurs.
                </p>
              </div>
              <Button onClick={() => router.push("/rides")}>
                Voir les trajets disponibles
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => {
              const unreadCount = conversation.unreadCount?.[user?.uid || ""] || 0;
              const otherUserId = conversation.participants.find(id => id !== user?.uid) || user?.uid;
              const otherUser = otherUserId ? userDetails[otherUserId] : null;
              const ride = rideDetails[conversation.rideId];
              
              return (
                <Card
                  key={conversation.id}
                  className="p-3 sm:p-4 hover:shadow-lg transition-all duration-200 cursor-pointer bg-white border-l-4 border-l-blue-500"
                  onClick={() => handleOpenConversation(conversation)}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-12 w-12 border-2 border-gray-200">
                        <AvatarImage 
                          src={otherUser?.profilePicture || ""} 
                          alt={otherUser?.fullName || "Avatar"} 
                        />
                        <AvatarFallback className="bg-blue-500 text-white font-semibold text-lg">
                          {otherUser?.fullName?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      {unreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs font-bold"
                        >
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-gray-900 truncate pr-2">
                          {otherUser?.fullName || "Chargement..."}
                        </h3>
                        {conversation.lastMessageTime && (
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {new Date(conversation.lastMessageTime.toDate()).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                      </div>
                      
                      {conversation.lastMessage && (
                        <p className="text-sm text-gray-600 line-clamp-1 pr-2">
                          {conversation.lastMessage}
                        </p>
                      )}
                      
                      {ride && (
                        <div className="flex flex-col gap-1 text-sm text-gray-500">
                          <div className="flex items-start gap-1">
                            <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="truncate">{ride.departureAddress}</div>
                              <div className="truncate">→ {ride.arrivalAddress}</div>
                            </div>
                          </div>
                          {ride.departureTime && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 flex-shrink-0" />
                              <span>
                                {ride.departureTime.toDate?.()?.toLocaleDateString("fr-FR") || "Date inconnue"}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center flex-shrink-0">
                      <Button variant="ghost" size="sm" className="px-2">
                        <span className="hidden sm:inline">Ouvrir</span>
                        <span className="sm:hidden">→</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {selectedConversation && (
          <ChatWindow
            isOpen={isChatOpen}
            onClose={() => {
              setIsChatOpen(false);
              setSelectedConversation(null);
            }}
            otherUserId={selectedConversation.otherUserId}
            otherUserName={selectedConversation.otherUserName}
            otherUserAvatar={selectedConversation.otherUserAvatar}
            rideId={selectedConversation.rideId}
            rideInfo={selectedConversation.rideInfo}
          />
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
