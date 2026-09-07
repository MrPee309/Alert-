import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { messagesApi, type Conversation, type Message } from "@/src/api/messages";
import { useDealLakayWebSocket } from "@/src/hooks/use-websocket";
import { useAuth } from "@/src/context/auth-context";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

function lastSeenText(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "kounye a";
  if (mins < 60) return `${mins}min pase`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}è pase`;
  return `${Math.floor(hrs / 24)}j pase`;
}

export default function ConversationDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await messagesApi.getMessages(id);
      setConversation(res.conversation);
      setMessages(res.messages);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Real-time incoming messages — reuses the existing DealLakay WebSocket,
  // not a new realtime system.
  useDealLakayWebSocket((evt) => {
    if (evt.conversation_id === id) {
      setMessages((cur) => [...cur, evt.data]);
    }
  });

  const send = async () => {
    if (!text.trim() || !id) return;
    const content = text.trim();
    setText("");
    setSending(true);
    try {
      const msg = await messagesApi.sendMessage(id, content);
      setMessages((cur) => [...cur, msg]);
    } catch {
      /* message simply doesn't appear — user can retype and resend */
    } finally {
      setSending(false);
    }
  };

  const otherName = conversation?.other_user?.username || "DealLakay";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()} testID="conversation-back" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </Pressable>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerName} numberOfLines={1}>@{otherName}</Text>
          {conversation?.other_user_online ? (
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>An liy</Text>
            </View>
          ) : conversation?.other_user_last_seen ? (
            <Text style={styles.headerSubject} numberOfLines={1}>Dènye fwa: {lastSeenText(conversation.other_user_last_seen)}</Text>
          ) : (
            !!conversation?.product_title && (
              <Text style={styles.headerSubject} numberOfLines={1}>{conversation.product_title}</Text>
            )
          )}
        </View>
        <View style={styles.iconButton} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brandPrimary} size="large" />
        </View>
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.emptyMessages}>
                <Ionicons name="chatbubble-outline" size={26} color={colors.onSurfaceTertiary} />
                <Text style={styles.emptyMessagesText}>Kòmanse konvèsasyon an — voye premye mesaj la.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const mine = item.sender_id === user?.id;
              return (
                <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                    <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.content}</Text>
                  </View>
                </View>
              );
            }}
          />

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Ekri yon mesaj..."
              placeholderTextColor={colors.onSurfaceTertiary}
              multiline
              testID="conversation-input"
            />
            <Pressable style={styles.sendButton} onPress={send} disabled={sending || !text.trim()} testID="conversation-send">
              <Ionicons name="send" size={18} color={colors.onBrandPrimary} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceSecondary },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.lg },
  iconButton: { width: 36, height: 36, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, ...shadow.card },
  headerTextWrap: { flex: 1, alignItems: "center" },
  headerName: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface },
  headerSubject: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  onlineDot: { width: 7, height: 7, borderRadius: radius.pill, backgroundColor: colors.success },
  onlineText: { fontSize: fontSize.sm, color: colors.success },
  emptyMessages: { alignItems: "center", gap: spacing.sm, paddingTop: spacing["3xl"] },
  emptyMessagesText: { color: colors.onSurfaceSecondary, fontSize: fontSize.sm, textAlign: "center", paddingHorizontal: spacing.xl },

  listContent: { padding: spacing.lg, gap: spacing.xs },
  bubbleRow: { flexDirection: "row" },
  bubbleRowMine: { justifyContent: "flex-end" },
  bubble: { maxWidth: "78%", borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.xs },
  bubbleTheirs: { backgroundColor: colors.surface, ...shadow.card },
  bubbleMine: { backgroundColor: colors.brandPrimary },
  bubbleText: { fontSize: fontSize.base, color: colors.onSurface },
  bubbleTextMine: { color: colors.onBrandPrimary },

  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm, padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.base,
    color: colors.onSurface,
    backgroundColor: colors.surfaceSecondary,
    maxHeight: 100,
  },
  sendButton: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" },
});
