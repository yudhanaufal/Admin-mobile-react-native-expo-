// src/components/StoreItem.tsx
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { Toko } from '../models/Toko';

type Props = {
  toko: Toko;
  onEdit: (toko: Toko) => void;
  onDelete: (id: string) => void;
};

export default function StoreItem({ toko, onEdit, onDelete }: Props) {
  return (
    <View style={styles.item}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{toko.nama}</Text>
        <Text>{toko.alamat}</Text>
        <Text>{toko.no_tlp}</Text>
      </View>
      <Button title="Edit" onPress={() => onEdit(toko)} />
      <Button title="Hapus" color="red" onPress={() => onDelete(toko.id)} />
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
