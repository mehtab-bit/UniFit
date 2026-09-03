import { useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Announces a meaningful screen title and context to the screen reader upon mounting
 */
export const useScreenAnnouncement = (announcementText: string) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      AccessibilityInfo.announceForAccessibility(announcementText);
    }, 250);

    return () => clearTimeout(timer);
  }, [announcementText]);
};
