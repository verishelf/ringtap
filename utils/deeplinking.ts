import * as Linking from 'expo-linking';

export const prefix = Linking.createURL('/');
export const linking = {
  prefixes: ['ringtap://', 'https://ringtap.me', 'https://www.ringtap.me'],
  config: {
    screens: {
      Activate: 'activate',
      Profile: 'profile',
    },
  },
};
