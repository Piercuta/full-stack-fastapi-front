import { Box, Code, Container, Heading, Stack, Text } from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import {
  type DashboardCacheInfo,
  fetchDashboardCache,
  invalidateDashboardCache,
} from "@/services/dashboardService"

const DashboardCache = () => {
  const queryClient = useQueryClient()
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["dashboard-cache"],
    queryFn: fetchDashboardCache,
  })

  const invalidateMutation = useMutation({
    mutationFn: invalidateDashboardCache,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-cache"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
    },
  })

  return (
    <Container maxW="full">
      <Heading size="sm" py={4}>
        Redis dashboard cache
      </Heading>
      <Text color="fg.muted" mb={4} fontSize="sm">
        Superuser view of the cached <Code>GET /dashboard/stats</Code> payload.
      </Text>

      <Stack direction="row" gap={2} mb={4}>
        <Button
          size="sm"
          variant="outline"
          loading={isFetching}
          onClick={() => refetch()}
        >
          Refresh
        </Button>
        <Button
          size="sm"
          variant="solid"
          colorPalette="red"
          loading={invalidateMutation.isPending}
          disabled={!data?.enabled || !data?.redis_reachable}
          onClick={() => invalidateMutation.mutate()}
        >
          Invalidate cache
        </Button>
      </Stack>

      {isLoading ? <Text color="fg.muted">Loading…</Text> : null}
      {isError ? (
        <Text color="red.500">
          {error instanceof Error ? error.message : "Failed to load cache info"}
        </Text>
      ) : null}

      {data ? <CacheDetails info={data} /> : null}
      {invalidateMutation.isSuccess ? (
        <Text color="fg.muted" fontSize="sm" mt={2}>
          {invalidateMutation.data.message}
        </Text>
      ) : null}
    </Container>
  )
}

function CacheDetails({ info }: { info: DashboardCacheInfo }) {
  return (
    <Stack gap={3}>
      <Text fontSize="sm">
        <Text as="span" fontWeight="semibold">
          REDIS_URL configured:{" "}
        </Text>
        {info.enabled ? "yes" : "no"}
      </Text>
      <Text fontSize="sm">
        <Text as="span" fontWeight="semibold">
          Redis reachable:{" "}
        </Text>
        {info.redis_reachable ? "yes" : "no"}
      </Text>
      <Text fontSize="sm">
        <Text as="span" fontWeight="semibold">
          Key:{" "}
        </Text>
        <Code>{info.key}</Code>
      </Text>
      <Text fontSize="sm">
        <Text as="span" fontWeight="semibold">
          TTL remaining:{" "}
        </Text>
        {info.ttl_seconds == null
          ? "n/a (miss or no expire)"
          : `${info.ttl_seconds}s`}{" "}
        <Text as="span" color="fg.muted">
          (configured {info.configured_ttl_seconds}s)
        </Text>
      </Text>
      <Box>
        <Text fontSize="sm" fontWeight="semibold" mb={2}>
          Payload
        </Text>
        <Box
          as="pre"
          p={3}
          borderWidth="1px"
          borderRadius="md"
          fontSize="xs"
          overflowX="auto"
          bg="bg.muted"
        >
          {info.payload
            ? JSON.stringify(info.payload, null, 2)
            : "(empty — cache miss)"}
        </Box>
      </Box>
    </Stack>
  )
}

export default DashboardCache
