import { router } from "expo-router";
import { useEffect, type ReactNode } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useConfirm } from "@/components/dialog";
import { useToast } from "@/components/toast";
import { Icon } from "@/components/ui";
import { C, F } from "@/constants/tokens";
import type { Cred } from "@/lib/vault";
import { useVault } from "@/lib/vault-context";

type IconName = Parameters<typeof Icon>[0]["name"];

/** Asks first, then deletes. `before` runs once confirmed, e.g. leaving the screen of the login being deleted. */
export function useDeleteLogin() {
  const v = useVault();
  const confirm = useConfirm();
  const toast = useToast();
  return async (c: Cred, before?: () => void) => {
    const ok = await confirm({
      title: `Delete ${c.title}?`,
      message: "It can’t be brought back unless it’s in a backup.",
      confirm: "Delete",
      cancel: "Keep it",
      destructive: true,
      icon: "delete",
    });
    if (!ok) return;
    before?.();
    await v.remove(c.id);
    toast.flash("Deleted", "delete");
  };
}

/**
 * Long-press menu for a login. Mount it to open. `row` is the pressed row's window position; `preview`
 * redraws that row there, above the dimmed list, so it lifts into a card with the menu attached.
 */
export function LoginMenu({
  c,
  row,
  preview,
  onClose,
}: {
  c: Cred;
  row: { y: number; h: number };
  preview: ReactNode;
  onClose: () => void;
}) {
  const v = useVault();
  const toast = useToast();
  const del = useDeleteLogin();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const items: {
    icon: IconName;
    label: string;
    danger?: boolean;
    run: () => void;
  }[] = [
    ...(c.password
      ? [
          {
            icon: "key" as const,
            label: "Copy password",
            run: () =>
              toast.copied("Password", c.password, v.settings.clipSecs),
          },
        ]
      : []),
    ...(c.username
      ? [
          {
            icon: "person" as const,
            label: "Copy username",
            run: () =>
              toast.copied("Username", c.username, v.settings.clipSecs),
          },
        ]
      : []),
    {
      icon: "star",
      label: c.fav ? "Remove from favorites" : "Add to favorites",
      run: () => v.toggleFav(c.id),
    },
    {
      icon: "edit",
      label: "Edit",
      run: () =>
        router.push({ pathname: "/add", params: { id: String(c.id) } }),
    },
    { icon: "delete", label: "Delete", danger: true, run: () => del(c) },
  ];

  // Below the row, or above it when there isn't room for the menu.
  const below = row.y + row.h + items.length * 48 + 48 < height - insets.bottom;
  const place = below
    ? { top: row.y + row.h + 6 }
    : { bottom: height - row.y + 6 };

  const lift = useSharedValue(1);
  useEffect(
    () => lift.set(withSpring(1, { damping: 14, stiffness: 260 })),
    [lift],
  );
  const liftStyle = useAnimatedStyle(() => ({
    transform: [{ scale: lift.get() }],
  }));

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <Pressable
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(42,36,32,.28)" },
        ]}
        onPress={onClose}
        accessibilityLabel="Close menu"
      />
      {/* Inset by 8 with 12/24 padding, so the content lines up with the row underneath (20/32). */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: row.y,
            left: 8,
            right: 8,
            height: row.h,
            paddingLeft: 12,
            paddingRight: 24,
            borderRadius: 20,
          },
          {
            backgroundColor: C.card,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            elevation: 10,
          },
          liftStyle,
        ]}
      >
        {preview}
      </Animated.View>
      <View
        accessibilityViewIsModal
        style={[
          {
            position: "absolute",
            right: 8, // flush with the lifted row's right edge
            minWidth: 224,
            paddingVertical: 6,
            borderRadius: 22,
            backgroundColor: C.sheet,
            elevation: 12,
          },
          place,
        ]}
      >
        {items.map((it) => (
          <Pressable
            key={it.label}
            onPress={() => {
              onClose();
              it.run();
            }}
            android_ripple={{ color: "#F1EAE1" }}
            accessibilityRole="menuitem"
            style={{
              height: 48,
              paddingHorizontal: 18,
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Icon
              name={it.icon}
              size={20}
              color={it.danger ? C.danger : C.rust}
              fill={it.icon === "star" && c.fav}
            />
            <Text
              style={{
                fontFamily: F.medium,
                fontSize: 15,
                color: it.danger ? C.danger : C.ink,
              }}
            >
              {it.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}
