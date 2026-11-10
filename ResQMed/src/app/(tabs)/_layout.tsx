import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "ResQMed",
        }}
      />
      <Tabs.Screen
      name="explore"
      options={{
        title: "Explore",
        }}
      />
    </Tabs>
  );
}