import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  Alert, 
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { tokoService } from '../services/tokoServices';
import StoreItem from '../components/StoreItem';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useNetwork } from '../hooks/useNetwork';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Toko } from '../models/Toko';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

// 1. Define your root stack param list
type RootStackParamList = {
  StoreList: undefined;
  StoreForm: { toko: Toko | null };
  // Add other screens here as needed
};

// 2. Define props for StoreList screen
type StoreListScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'StoreList'
>;

// 3. If you need route props (though StoreList might not need them)
type StoreListScreenRouteProp = RouteProp<RootStackParamList, 'StoreList'>;

interface StoreListProps {
  navigation: StoreListScreenNavigationProp;
  route: StoreListScreenRouteProp;
}

const StoreList: React.FC<StoreListProps> = ({ navigation, route }) => {
  const [list, setList] = useState<Toko[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const isFocused = useIsFocused();
  const { isConnected } = useNetwork();

  // Load data function
  const load = async () => {
    try {
      setLoading(true);
      const items = await tokoService.getAll();
      setList(items);
    } catch (error) {
      console.error('Error loading stores:', error);
      Alert.alert('Error', 'Failed to load store list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Sync to Firestore
  const syncToFirestore = async () => {
    try {
      setSyncing(true);
      await tokoService.syncToFirestore();
      Alert.alert('Success', 'Data synchronized successfully');
      load();
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert('Error', 'Failed to synchronize data');
    } finally {
      setSyncing(false);
    }
  };

  // Edit store handler
  const onEdit = (toko: Toko) => {
    navigation.navigate('StoreForm', { toko });
  };

  // Delete store handler
  const onDelete = async (id: string) => {
    Alert.alert(
      'Delete Store', 
      'Are you sure you want to delete this store?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await tokoService.remove(id);
              load();
              Alert.alert('Success', 'Store deleted successfully');
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete store');
            }
          },
        },
      ]
    );
  };

  // Add store handler
  const onAddStore = () => {
    navigation.navigate('StoreForm', { toko: null });
  };

  // Refresh handler
  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  // Load data when screen is focused
  useEffect(() => {
    if (isFocused) load();
  }, [isFocused]);

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading stores...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Store List</Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.syncButton} 
            onPress={syncToFirestore}
            disabled={syncing || !isConnected}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Icon name="sync" size={18} color="#ffffff" />
                <Text style={styles.buttonText}> Sync</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={onAddStore}
          >
            <Icon name="add" size={18} color="#ffffff" />
            <Text style={styles.buttonText}> Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StoreItem 
            toko={item} 
            onEdit={() => onEdit(item)}
            onDelete={() => onDelete(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="store" size={50} color="#d1d5db" />
            <Text style={styles.emptyText}>No stores registered</Text>
            <TouchableOpacity 
              style={styles.addButtonSmall}
              onPress={onAddStore}
            >
              <Icon name="add" size={16} color="#ffffff" />
              <Text style={styles.buttonText}> Add Store</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={[
          styles.listContentContainer,
          list.length === 0 && styles.emptyListContainer
        ]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContentContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyListContainer: {
    flex: 1,
  },
});

export default StoreList;