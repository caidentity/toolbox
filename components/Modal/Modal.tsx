'use client';

import React from "react";
import styles from "./Modal.module.scss"; // Import SCSS module for custom styling
import { Icon } from "@glyphkit/glyphkit";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: string | number;
  overlayClassName?: string;
  modalClassName?: string;
}

interface ModalHeaderProps {
  onClose?: () => void;
  className?: string;
  title?: React.ReactNode;
  showCloseButton?: boolean;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalFooterProps {
  className?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  primaryButtonDisabled?: boolean;
  secondaryButtonDisabled?: boolean;
  primaryButtonClassName?: string;
  secondaryButtonClassName?: string;
  showDefaultButtons?: boolean;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  alignment?: "left" | "center" | "right";
}

// Modal Container Component with Framer Motion animations
const Modal: React.FC<ModalProps> = ({
  isOpen = false,
  onClose,
  children,
  width = "500px",
  overlayClassName = "",
  modalClassName = "",
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${overlayClassName}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className={`relative max-h-[90vh] overflow-auto rounded-lg bg-white shadow-xl dark:bg-gray-800 ${modalClassName}`}
            style={{ width }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Modal Header Component
const ModalHeader: React.FC<ModalHeaderProps> = ({
  onClose,
  className = "",
  title,
  showCloseButton = true,
  leftContent,
  rightContent,
}) => {
  return (
    <div className={`${styles.modalHeader} ${className}`}>
      <div className={styles.modalHeaderLeft}>
        {leftContent}
        {title && <div className={styles.modalHeaderTitle}>{title}</div>}
      </div>

      <div className={styles.modalHeaderRight}>
        {rightContent}
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className={styles.modalCloseButton}
            aria-label="Close modal"
          >
            <Icon name="x_16" size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

// Modal Content Component
const ModalContent: React.FC<ModalContentProps> = ({ children, className = "" }) => {
  return <div className={`${styles.modalBody} ${className}`}>{children}</div>;
};

// Modal Footer Component
const ModalFooter: React.FC<ModalFooterProps> = ({
  className = "",
  primaryButtonText = "Confirm",
  secondaryButtonText = "Cancel",
  onPrimaryClick,
  onSecondaryClick,
  primaryButtonDisabled = false,
  secondaryButtonDisabled = false,
  primaryButtonClassName = "",
  secondaryButtonClassName = "",
  showDefaultButtons = true,
  leftContent,
  rightContent,
  alignment = "right",
}) => {
  const getAlignmentKey = () => {
    switch (alignment) {
      case "left":
        return "justifyStart";
      case "center":
        return "justifyCenter";
      case "right":
      default:
        return "justifyEnd";
    }
  };

  return (
    <div className={`${styles.modalFooter} ${styles[getAlignmentKey()]} ${className}`}>
      {leftContent}

      <div>
        {showDefaultButtons && (
          <>
            <button
              onClick={onSecondaryClick}
              disabled={secondaryButtonDisabled}
              className={`${styles.modalButton} ${styles.modalButtonSecondary} ${secondaryButtonClassName}`}
            >
              {secondaryButtonText}
            </button>
            <button
              onClick={onPrimaryClick}
              disabled={primaryButtonDisabled}
              className={`${styles.modalButton} ${styles.modalButtonPrimary} ${primaryButtonClassName}`}
            >
              {primaryButtonText}
            </button>
          </>
        )}
      </div>

      {rightContent}
    </div>
  );
};

/* Example usage component
const ExampleModal = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} width="50vw">
      <ModalHeader
        onClose={() => setIsOpen(false)}
        title="Example Modal Title"
        leftContent={<span className={styles.modalIcon}>🚀</span>}
        rightContent={<button className={styles.modalHeaderButton}>Help</button>}
      />

      <ModalContent>
        <p>This is an example modal with customizable header and footer.</p>
      </ModalContent>

      <ModalFooter
        primaryButtonText="Save Changes"
        secondaryButtonText="Discard"
        onPrimaryClick={() => console.log("Primary action")}
        onSecondaryClick={() => setIsOpen(false)}
        leftContent={<span className={styles.modalFooterText}>Draft saved</span>}
        alignment="right"
      />
    </Modal>
  );
};
*/

export { Modal, ModalHeader, ModalContent, ModalFooter };
