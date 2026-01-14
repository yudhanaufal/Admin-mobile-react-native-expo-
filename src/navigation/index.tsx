import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DashboardScreen from "../screens/DashboardScreen";
import StoreList from "../screens/StoreList";
import StoreForm from "../screens/StoreForm";
import ProductList from "../screens/ProductList";
import ProductForm from "../screens/ProductForm"; 
import ProductDetail from "../screens/ProductDetail";
import PilihToko from "../screens/PilihToko";
import PembelianScreen from "../screens/Pembelian";              // Form pembelian
import PembelianListScreen from "../screens/PembelianListScreen"; // List pembelian
import PembelianDetailScreen from "../screens/PembelianDetailScreen"; // Detail pembelian
import ReturListScreen  from "../screens/ReturListScreen";
import ReturFormScreen from "../screens/ReturFormScreen";
import Laporan_p from "../screens/Laporan_p";
import LaporanSetoranScreen from "../screens/LaporanSetoranScreen";
import DebugScreen from "../screens/DebugScreen";
import LaporanOperasionalScreen from "../screens/LaporanOpersionalScreen";
export type RootStackParamList = {
  Dashboard: undefined;
  StoreList: undefined;
  StoreForm: { toko?: any } | undefined; 
  ProductList: undefined;
  ProductForm: undefined;
  ProductDetail: undefined;
  PilihToko: undefined;
  PembelianScreen: { storeId: string };
  PembelianList: undefined;
  PembelianDetail: { pembelianId: string };   
  ReturList: undefined;
  ReturFormScreen: { mode: string; returId?: string };
  Laporan_p: undefined;
  LaporanSetoran: undefined;
  Debug: undefined;
  LaporanOperasional: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="PilihToko">
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: "Dashboard", headerShown: false }}
        />
        <Stack.Screen
          name="StoreList"
          component={StoreList}
          options={{ title: "Daftar Toko" , headerShown: false }}
        />
        <Stack.Screen
          name="PembelianScreen"
          component={PembelianScreen}
          options={{ title: "Pembelian Barang", headerShown: false }}
        />
        <Stack.Screen
          name="PembelianList"
          component={PembelianListScreen}
          options={{ title: "List Pembelian", headerShown: false }}
        />
        <Stack.Screen
          name="PembelianDetail"
          component={PembelianDetailScreen}
          options={{ title: "Detail Pembelian", headerShown: false }}
        />

        <Stack.Screen
          name="StoreForm"
          component={StoreForm}
          options={{ title: "Form Toko", headerShown: false }}
        />
        <Stack.Screen name="ProductList" component={ProductList} options={{ title: "Daftar Produk", headerShown: false }} />
        <Stack.Screen name="ProductForm" component={ProductForm} options={{ title: "Form Produk", headerShown: false }} />
        <Stack.Screen name="ProductDetail" component={ProductDetail} options={{ title: "Detail Produk", headerShown: false }} />
        <Stack.Screen name="PilihToko" component={PilihToko} options={{ headerShown: false }} />
        <Stack.Screen name="ReturList" component={ReturListScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ReturFormScreen" component={ReturFormScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Laporan_p" component={Laporan_p} options={{ headerShown: false }} />
        <Stack.Screen name="LaporanSetoran" component={LaporanSetoranScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Debug" component={DebugScreen} options={{ headerShown: false }} />
        <Stack.Screen name="LaporanOperasional" component={LaporanOperasionalScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
