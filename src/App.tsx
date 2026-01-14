import React from 'react';
import AppNavigator from './navigation';
import { Buffer } from 'buffer';

global.Buffer = Buffer;
export default function App() {
  return <AppNavigator />;
}