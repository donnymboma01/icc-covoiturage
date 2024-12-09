/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, ReactNode } from "react";
import { Badge } from "./badge";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg">
      
        <div className="border-b px-4 py-3 flex justify-between items-center">
          <h2 id="modal-title" className="text-lg font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            className="text-gray-500 hover:text-black"
          >
            ×
          </button>
        </div>

        <div className="px-4 py-3">{children}</div>

        {/* <div className="border-t px-4 py-3 text-right">
          <Badge
            onClick={onClose}
            className="bg-slate-700 text-white px-4 py-2 hover:bg-slate-400"
          >
            Fermer
          </Badge>
        </div> */}
      </div>
    </div>
  );
};

export default Modal;
