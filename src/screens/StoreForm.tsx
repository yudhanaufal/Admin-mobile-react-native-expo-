import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { tokoService } from '../services/tokoServices';
import { Toko } from '../models/Toko';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

type ParamList = {
  StoreForm: { toko?: Toko | null };
};

export default function StoreForm() {
  const route = useRoute<RouteProp<ParamList, 'StoreForm'>>();
  const nav = useNavigation();
  const toko = route.params?.toko ?? null;

  const [nama, setNama] = useState(toko?.nama ?? '');
  const [alamat, setAlamat] = useState(toko?.alamat ?? '');
  const [noTlp, setNoTlp] = useState(toko?.no_tlp ?? '');
  const [pin, setPin] = useState(toko?.pin ?? '');

  useEffect(() => {
    if (toko) {
      setNama(toko.nama ?? '');
      setAlamat(toko.alamat ?? '');
      setNoTlp(toko.no_tlp ?? '');
      setPin(toko.pin ?? '');
    }
  }, [toko]);

  async function onSave() {
    if (!nama.trim()) {
      return Alert.alert('Error', 'Nama harus diisi');
    }

    if (pin && pin.length !== 4) {
      return Alert.alert('Error', 'PIN harus 4 digit');
    }

    try {
      const tokoData = {
        nama,
        alamat,
        no_tlp: noTlp,
        pin: pin || undefined, // Set to undefined if empty
        updatedAt: Date.now()
      };

      if (toko) {
        await tokoService.update(toko.id, tokoData);
      } else {
        await tokoService.create(tokoData);
      }
      
      nav.goBack();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Gagal menyimpan data toko');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nama Toko*</Text>
      <TextInput
        style={styles.input}
        value={nama}
        onChangeText={setNama}
        placeholder="Masukkan nama toko"
        autoFocus
      />

      <Text style={styles.label}>Alamat</Text>
      <TextInput
        style={styles.input}
        value={alamat}
        onChangeText={setAlamat}
        placeholder="Masukkan alamat toko"
      />

      <Text style={styles.label}>No. Telepon</Text>
      <TextInput
        style={styles.input}
        value={noTlp}
        onChangeText={setNoTlp}
        placeholder="Contoh: 08123456789"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>PIN (4 digit)</Text>
      <TextInput
        style={styles.input}
        value={pin}
        onChangeText={(text) => setPin(text.replace(/[^0-9]/g, ''))}
        placeholder="Opsional - Masukkan 4 digit PIN"
        keyboardType="numeric"
        maxLength={4}
        secureTextEntry
      />

      <View style={styles.buttonContainer}>
        <Button
          title={toko ? "Update Toko" : "Buat Toko"}
          onPress={onSave}
          color="#3b82f6"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  label: {
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 4,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  buttonContainer: {
    marginTop: 24,
    borderRadius: 8,
    overflow: 'hidden',
  },
});