import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, View } from "react-native";
import { useApp } from "../context/AppContext";
import AuthScreen from "../screens/AuthScreen";
import DashboardScreen from "../screens/DashboardScreen";
import TasksScreen from "../screens/TasksScreen";
import NewTaskScreen from "../screens/NewTaskScreen";
import FocusScreen from "../screens/FocusScreen";
import { colors } from "../theme";

const RootStack = createNativeStackNavigator();
const TasksStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TasksStackScreen() {
  return (
    <TasksStack.Navigator>
      <TasksStack.Screen name="TasksList" component={TasksScreen} options={{ title: "Minhas Tarefas" }} />
      <TasksStack.Screen name="NewTask" component={NewTaskScreen} options={{ title: "Nova Tarefa" }} />
    </TasksStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { height: 62, paddingBottom: 8, paddingTop: 8 },
        tabBarIcon: ({ color, size }) => {
          const map = {
            Painel: "home-outline",
            Tarefas: "list-outline",
            Foco: "timer-outline",
          };
          return <Ionicons name={map[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Painel" component={DashboardScreen} />
      <Tab.Screen name="Tarefas" component={TasksStackScreen} />
      <Tab.Screen name="Foco" component={FocusScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { bootstrapped, user } = useApp();

  if (!bootstrapped) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.primaryDark} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <RootStack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <RootStack.Screen name="Main" component={MainTabs} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
