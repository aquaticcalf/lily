import { Pressable, Text, View } from "react-native"
import { withUniwind } from "uniwind"
import { useAuth } from "./context"

const StyledView = withUniwind(View)
const StyledText = withUniwind(Text)
const StyledPressable = withUniwind(Pressable)

export function SignInScreen() {
  const { signIn } = useAuth()

  return (
    <StyledView className="flex-1 justify-center items-center bg-white dark:bg-black px-8">
      <StyledText className="text-3xl font-bold text-black dark:text-white mb-2">lily</StyledText>
      <StyledText className="text-base text-gray-500 dark:text-gray-400 mb-12">
        sign in to continue
      </StyledText>
      <StyledPressable
        className="bg-black dark:bg-white rounded-full px-8 py-4 w-full items-center"
        onPress={signIn}
      >
        <StyledText className="text-white dark:text-black text-base font-semibold">
          Continue with Google
        </StyledText>
      </StyledPressable>
    </StyledView>
  )
}
